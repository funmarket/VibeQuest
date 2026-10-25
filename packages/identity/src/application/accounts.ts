import { credentialsSchema } from "@vq/contracts";
import type { IdentityRepository, IdentityCrypto } from "../domain/ports";
import { IdentityError } from "../domain/error";

export function createAccounts(
  repository: IdentityRepository,
  crypto: IdentityCrypto,
) {
  function session() {
    const token = crypto.newToken();
    return {
      token,
      stored: {
        tokenHash: crypto.digest(token),
        expiresAt: new Date(Date.now() + 14 * 86400000),
      },
    };
  }
  async function throttle(key: string, action: string) {
    if (
      !(await repository.consumeAttempt(
        crypto.digest(`${action}:${key}`),
        action === "register" ? 10 : 30,
        600,
      ))
    )
      throw new IdentityError("RATE_LIMITED");
  }
  return {
    availableUsers: (ids: string[]) => repository.availableUsers(ids),
    canReviewBusiness: (userId: string) =>
      repository.hasPrivilege(userId, "business.review"),
    canModerateContent: (userId: string) =>
      repository.hasPrivilege(userId, "content.moderate"),
    async register(input: unknown, caller: string) {
      const { email, password } = credentialsSchema.parse(input);
      await throttle(caller, "register");
      const passwordHash = await crypto.hashPassword(password);
      const fresh = session();
      const account = await repository.register(
        email,
        passwordHash,
        fresh.stored,
      );
      return { account, token: fresh.token };
    },
    async login(input: unknown, caller: string) {
      const { email, password } = credentialsSchema.parse(input);
      await throttle(caller, "login");
      const existing = await repository.findPassword(email);
      const valid = await crypto.verifyPassword(
        password,
        existing?.passwordHash ?? null,
      );
      if (!existing || !valid) throw new IdentityError("INVALID_CREDENTIALS");
      const fresh = session();
      await repository.createSession(existing.account.id, fresh.stored);
      return { account: existing.account, token: fresh.token };
    },
    me(token: string | undefined) {
      return token && /^[A-Za-z0-9_-]{43}$/.test(token)
        ? repository.findSession(crypto.digest(token))
        : Promise.resolve(null);
    },
    async logout(token: string | undefined) {
      if (token && /^[A-Za-z0-9_-]{43}$/.test(token))
        await repository.revokeSession(crypto.digest(token));
    },
  };
}
