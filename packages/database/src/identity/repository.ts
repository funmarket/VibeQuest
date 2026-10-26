import type { Pool, PoolClient } from "pg";
import type { Account } from "@vq/contracts";
import type { IdentityRepository, NewSession } from "@vq/identity/ports";
import { IdentityError } from "@vq/identity";

async function insertSession(
  client: Pool | PoolClient,
  userId: string,
  session: NewSession,
) {
  await client
    .query(
      "INSERT INTO identity_sessions(user_id,token_hash,expires_at) SELECT id,$2,$3 FROM identity_users WHERE id=$1 AND disabled_at IS NULL RETURNING id",
      [userId, session.tokenHash, session.expiresAt],
    )
    .then((result) => {
      if (result.rowCount !== 1) throw new IdentityError("INVALID_CREDENTIALS");
    });
}

export function createIdentityRepository(
  pool: Pool,
  sessionPool: Pool = pool,
): IdentityRepository {
  return {
    async withSession(tokenHash, work) {
      const client = await sessionPool.connect();
      try {
        await client.query("BEGIN");
        const row = (
          await client.query(
            'SELECT s.user_id AS "userId",s.token_hash AS "sessionKey",s.expires_at AS "sessionExpiresAt" FROM identity_sessions s JOIN identity_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() AND u.disabled_at IS NULL FOR SHARE OF s,u',
            [tokenHash],
          )
        ).rows[0];
        const result = await work(
          row
            ? { ...row, sessionExpiresAt: row.sessionExpiresAt.toISOString() }
            : null,
        );
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async availableUsers(ids) {
      return (
        await pool.query(
          "SELECT id FROM identity_users WHERE id=ANY($1::uuid[]) AND disabled_at IS NULL",
          [ids],
        )
      ).rows.map((row) => row.id);
    },
    async hasPrivilege(userId, privilege) {
      return (
        (
          await pool.query(
            "SELECT p.user_id FROM identity_privileges p JOIN identity_users u ON u.id=p.user_id WHERE p.user_id=$1 AND p.privilege=$2 AND u.disabled_at IS NULL",
            [userId, privilege],
          )
        ).rowCount === 1
      );
    },
    async register(email, passwordHash, session) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const user = await client.query<{ id: string }>(
          "INSERT INTO identity_users DEFAULT VALUES RETURNING id",
        );
        const id = user.rows[0].id;
        await client.query(
          "INSERT INTO identity_password_accounts(user_id,email,password_hash) VALUES($1,$2,$3)",
          [id, email, passwordHash],
        );
        await insertSession(client, id, session);
        await client.query("COMMIT");
        return { id, email, emailVerified: false };
      } catch (error) {
        await client.query("ROLLBACK");
        if ((error as { code?: string }).code === "23505")
          throw new IdentityError("EMAIL_UNAVAILABLE");
        throw error;
      } finally {
        client.release();
      }
    },
    async findPassword(email) {
      const result = await pool.query<Account & { passwordHash: string }>(
        `SELECT u.id,a.email,a.email_verified_at IS NOT NULL AS "emailVerified",a.password_hash AS "passwordHash" FROM identity_password_accounts a JOIN identity_users u ON u.id=a.user_id WHERE a.email=$1 AND u.disabled_at IS NULL`,
        [email],
      );
      const row = result.rows[0];
      return row
        ? {
            account: {
              id: row.id,
              email: row.email,
              emailVerified: row.emailVerified,
            },
            passwordHash: row.passwordHash,
          }
        : null;
    },
    createSession: (userId, session) => insertSession(pool, userId, session),
    async findSession(tokenHash) {
      const result = await pool.query<Account>(
        `SELECT u.id,a.email,a.email_verified_at IS NOT NULL AS "emailVerified" FROM identity_sessions s JOIN identity_users u ON u.id=s.user_id JOIN identity_password_accounts a ON a.user_id=u.id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.disabled_at IS NULL`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },
    async revokeSession(tokenHash) {
      await pool.query(
        "UPDATE identity_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL",
        [tokenHash],
      );
    },
    async consumeAttempt(key, maximum, windowSeconds) {
      const result = await pool.query<{ attempts: number }>(
        `INSERT INTO identity_attempt_limits(key_hash,attempts,resets_at) VALUES($1,1,now()+make_interval(secs=>$2)) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN identity_attempt_limits.resets_at<=now() THEN 1 ELSE identity_attempt_limits.attempts+1 END,resets_at=CASE WHEN identity_attempt_limits.resets_at<=now() THEN now()+make_interval(secs=>$2) ELSE identity_attempt_limits.resets_at END RETURNING attempts`,
        [key, windowSeconds],
      );
      return result.rows[0].attempts <= maximum;
    },
  };
}
