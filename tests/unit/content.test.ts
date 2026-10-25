import { expect, it } from "vitest";
import { gossipPostInputSchema } from "../../packages/contracts/src/content";
import {
  assertPostRestore,
  assertPostAuthor,
} from "../../packages/content/src/domain/invariants";

const author = "00000000-0000-4000-8000-000000000001";
const image = "00000000-0000-4000-8000-000000000002";

it("requires real text or an image, defaults to Public, and rejects actor spoofing", () => {
  expect(
    gossipPostInputSchema.parse({
      text: "hello",
      locationLabel: "",
      mediaId: null,
    }).audience,
  ).toBe("PUBLIC");
  expect(
    gossipPostInputSchema.safeParse({
      text: "   ",
      locationLabel: "",
      mediaId: null,
    }).success,
  ).toBe(false);
  expect(
    gossipPostInputSchema.safeParse({
      text: "",
      locationLabel: "",
      mediaId: image,
      audience: "FOLLOWERS_ONLY",
    }).success,
  ).toBe(true);
  expect(
    gossipPostInputSchema.safeParse({
      text: "hello",
      locationLabel: "",
      mediaId: null,
      authorId: author,
    }).success,
  ).toBe(false);
});

it("enforces original JS string-length limits including surrogate pairs", () => {
  const input = {
    text: "😀".repeat(140),
    locationLabel: "a".repeat(40),
    mediaId: null,
  };
  expect(gossipPostInputSchema.safeParse(input).success).toBe(true);
  expect(
    gossipPostInputSchema.safeParse({ ...input, text: input.text + "x" })
      .success,
  ).toBe(false);
  expect(
    gossipPostInputSchema.safeParse({ ...input, locationLabel: "a".repeat(41) })
      .success,
  ).toBe(false);
});

it("limits author lifecycle actions to the actual author", () => {
  expect(() => assertPostAuthor(author, author)).not.toThrow();
  expect(() => assertPostAuthor(image, author)).toThrow("CONTENT_FORBIDDEN");
});

it("permits restoration only before the eleven-day boundary and only for deleted posts", () => {
  const deletedAt = "2026-10-01T00:00:00.000Z";
  const deadline = Date.parse("2026-10-12T00:00:00.000Z");
  expect(() => assertPostRestore(deletedAt, deadline - 1)).not.toThrow();
  expect(() => assertPostRestore(deletedAt, deadline)).toThrow(
    "CONTENT_RESTORE_EXPIRED",
  );
  expect(() => assertPostRestore(null, deadline)).toThrow("CONTENT_CONFLICT");
});
