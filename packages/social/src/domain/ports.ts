import type { PublicProfile, Relationship, SocialCursor } from "@vq/contracts";
export interface SocialRepository {
  setBlock(actor: string, target: string, blocked: boolean): Promise<void>;
  blockedUsers(actor: string): Promise<string[]>;
  feedAuthors(actor: string): Promise<string[]>;
  withRelationship<T>(
    actor: string | undefined,
    target: string,
    work: (facts: { following: boolean; blocked: boolean }) => Promise<T>,
  ): Promise<T>;
  setFollow(actor: string, target: string, following: boolean): Promise<void>;
  scan(
    actor: string,
    side: "following" | "followers",
    after: SocialCursor | null,
    limit: number,
  ): Promise<SocialCursor[]>;
  states(actor: string | undefined, ids: string[]): Promise<Relationship[]>;
}
export interface SocialAccounts {
  availableUsers(ids: string[]): Promise<string[]>;
}
export interface SocialProfiles {
  publicMany(ids: string[]): Promise<PublicProfile[]>;
}
