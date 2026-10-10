import { it, expect } from "vitest";
import { assertDifferentUsers } from "../../packages/social/src/domain/invariants";
import {
  publicProfileSchema,
  followInputSchema,
  socialQuerySchema,
} from "@vq/contracts";
it("rejects self-follow and forged actor claims", () => {
  expect(() => assertDifferentUsers("a", "a")).toThrow("SELF_FOLLOW");
  expect(
    followInputSchema.safeParse({ following: true, followerId: "a" }).success,
  ).toBe(false);
});
it("public projection rejects private metadata and incomplete cursors", () => {
  const profile = {
    id: "11111111-1111-4111-8111-111111111111",
    handle: null,
    name: "",
    bio: "",
  };
  expect(
    publicProfileSchema.safeParse({ ...profile, photoMediaId: "private" })
      .success,
  ).toBe(false);
  expect(
    socialQuerySchema.safeParse({ side: "following", afterId: profile.id })
      .success,
  ).toBe(false);
  expect(publicProfileSchema.safeParse(profile).success).toBe(true);
});
