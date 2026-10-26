import type { Account } from "@vq/contracts";

export interface NewSession {
  tokenHash: string;
  expiresAt: Date;
}
export type IdentitySession = {
  userId: string;
  sessionKey: string;
  sessionExpiresAt: string;
};
export interface IdentityRepository {
  withSession<T>(
    tokenHash: string,
    work: (session: IdentitySession | null) => Promise<T>,
  ): Promise<T>;
  availableUsers(ids: string[]): Promise<string[]>;
  hasPrivilege(
    userId: string,
    privilege: "business.review" | "content.moderate",
  ): Promise<boolean>;
  register(
    email: string,
    passwordHash: string,
    session: NewSession,
  ): Promise<Account>;
  findPassword(
    email: string,
  ): Promise<{ account: Account; passwordHash: string } | null>;
  createSession(userId: string, session: NewSession): Promise<void>;
  findSession(tokenHash: string): Promise<Account | null>;
  revokeSession(tokenHash: string): Promise<void>;
  consumeAttempt(
    key: string,
    maximum: number,
    windowSeconds: number,
  ): Promise<boolean>;
}
export interface IdentityCrypto {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, encoded: string | null): Promise<boolean>;
  newToken(): string;
  digest(token: string): string;
}
