import type { Pool } from "pg";
import type { BusinessRepository, BusinessRecord } from "@vq/business/ports";
import { BusinessError } from "@vq/business";
const projection = `o.id,o.owner_id AS "ownerId",o.name,o.description,o.status,m.role,m.status AS "membershipStatus"`;
export function createBusinessRepository(pool: Pool): BusinessRepository {
  const read = async (actorId: string, id: string) =>
    (
      await pool.query<BusinessRecord>(
        `SELECT ${projection} FROM business_organizations o JOIN business_memberships m ON m.organization_id=o.id WHERE m.user_id=$1 AND o.id=$2`,
        [actorId, id],
      )
    ).rows[0] ?? null;
  return {
    read,
    async create(actorId, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const org = await client.query<{ id: string }>(
          "INSERT INTO business_organizations(owner_id,name,description) VALUES($1,$2,$3) RETURNING id",
          [actorId, input.name, input.description],
        );
        await client.query(
          "INSERT INTO business_memberships(organization_id,user_id,role,status) VALUES($1,$2,'owner','active')",
          [org.rows[0].id, actorId],
        );
        const result = await client.query<BusinessRecord>(
          `SELECT ${projection} FROM business_organizations o JOIN business_memberships m ON m.organization_id=o.id WHERE o.id=$1 AND m.user_id=$2`,
          [org.rows[0].id, actorId],
        );
        await client.query("COMMIT");
        return result.rows[0];
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async mine(actorId) {
      return (
        await pool.query<BusinessRecord>(
          `SELECT ${projection} FROM business_organizations o JOIN business_memberships m ON m.organization_id=o.id WHERE m.user_id=$1 ORDER BY o.created_at,o.id LIMIT 100`,
          [actorId],
        )
      ).rows;
    },
    async invite(actorId, id, userId) {
      try {
        const result = await pool.query(
          "INSERT INTO business_memberships(organization_id,user_id,role,status) SELECT $1,$2,'member','invited' WHERE EXISTS(SELECT 1 FROM business_organizations WHERE id=$1 AND owner_id=$3) ON CONFLICT DO NOTHING",
          [id, userId, actorId],
        );
        if (result.rowCount !== 1) throw new BusinessError("BUSINESS_CONFLICT");
      } catch (error) {
        if ((error as { code?: string }).code === "23503")
          throw new BusinessError("MEMBER_UNAVAILABLE");
        throw error;
      }
    },
    async accept(actorId, id) {
      const result = await pool.query(
        "UPDATE business_memberships SET status='active' WHERE organization_id=$1 AND user_id=$2 AND role='member' AND status='invited'",
        [id, actorId],
      );
      if (result.rowCount !== 1) throw new BusinessError("BUSINESS_CONFLICT");
      const record = await read(actorId, id);
      if (!record) throw new BusinessError("BUSINESS_CONFLICT");
      return record;
    },
    async review(actorId, id, decision) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          "UPDATE business_organizations SET status=$2 WHERE id=$1 AND status='pending'",
          [id, decision],
        );
        if (result.rowCount !== 1) throw new BusinessError("BUSINESS_CONFLICT");
        await client.query(
          "INSERT INTO business_reviews(organization_id,reviewer_id,decision) VALUES($1,$2,$3)",
          [id, actorId, decision],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
