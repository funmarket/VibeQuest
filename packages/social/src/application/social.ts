import type { SocialCursor, SocialPerson } from "@vq/contracts";
import type {
  SocialRepository,
  SocialAccounts,
  SocialProfiles,
} from "../domain/ports";
import { SocialError, assertDifferentUsers } from "../domain/invariants";
export function createSocial(
  repository: SocialRepository,
  accounts: SocialAccounts,
  profiles: SocialProfiles,
) {
  async function available(id: string) {
    if (!(await accounts.availableUsers([id])).length)
      throw new SocialError("SOCIAL_NOT_FOUND");
  }
  async function count(id: string, side: "following" | "followers") {
    let cursor: SocialCursor | null = null;
    let total = 0;
    for (;;) {
      const batch = await repository.scan(id, side, cursor, 1000);
      if (!batch.length) return total;
      total += (await accounts.availableUsers(batch.map((row) => row.id)))
        .length;
      if (batch.length < 1000) return total;
      cursor = batch.at(-1)!;
    }
  }
  async function counts(id: string) {
    const [following, followers] = await Promise.all([
      count(id, "following"),
      count(id, "followers"),
    ]);
    return { following, followers };
  }
  return {
    async state(target: string, actor?: string) {
      await available(target);
      return {
        ...(await repository.states(actor, [target]))[0],
        counts: await counts(target),
      };
    },
    async follow(actor: string, target: string, following: boolean) {
      assertDifferentUsers(actor, target);
      if (following) {
        const active = await accounts.availableUsers([actor, target]);
        if (!active.includes(actor)) throw new SocialError("AUTH_REQUIRED");
        if (!active.includes(target)) throw new SocialError("SOCIAL_NOT_FOUND");
      }
      await repository.setFollow(actor, target, following);
      if (!(await accounts.availableUsers([target])).length)
        return { following: false, followedBy: false, mutual: false };
      return (await repository.states(actor, [target]))[0];
    },
    async list(
      actor: string,
      side: "following" | "followers",
      after: SocialCursor | null,
    ) {
      await available(actor);
      const people: SocialPerson[] = [];
      let cursor = after;
      let last: SocialCursor | null = null;
      for (;;) {
        const rows = await repository.scan(actor, side, cursor, 100);
        if (!rows.length) break;
        const publicProfiles = await profiles.publicMany(
          rows.map((row) => row.id),
        );
        const map = new Map(
          publicProfiles.map((profile) => [profile.id, profile]),
        );
        const states = await repository.states(
          actor,
          rows.map((row) => row.id),
        );
        for (let i = 0; i < rows.length; i++) {
          const profile = map.get(rows[i].id);
          if (!profile) continue;
          if (people.length === 20)
            return { people, counts: await counts(actor), nextCursor: last };
          people.push({ profile, relationship: states[i] });
          last = rows[i];
        }
        if (rows.length < 100) break;
        cursor = rows.at(-1)!;
      }
      return { people, counts: await counts(actor), nextCursor: null };
    },
  };
}
