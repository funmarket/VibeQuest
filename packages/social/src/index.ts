export { createSocial } from "./application/social";
export { SocialError, assertDifferentUsers } from "./domain/invariants";
export type {
  SocialRepository,
  SocialAccounts,
  SocialProfiles,
} from "./domain/ports";
