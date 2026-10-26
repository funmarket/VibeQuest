import { expect, it } from "vitest";
import {
  homePostPath,
  homePostId,
  copyHomePost,
} from "../../apps/web/src/features/home/post-link";

const id = "00000000-0000-4000-8000-000000000001";
it("builds a locale Home link for the canonical authorized reader and rejects malformed queries", () => {
  expect(homePostPath("ar", id)).toBe(`/ar/home?post=${id}#home-feed`);
  expect(homePostId(id.toUpperCase())).toBe(id);
  expect(homePostId([id])).toBe("invalid");
  expect(homePostId("javascript:alert(1)")).toBe("invalid");
  expect(homePostId(undefined)).toBeNull();
});
it("copies only the actual link and awaits success; denied or unavailable clipboard never succeeds", async () => {
  let copied = "";
  await copyHomePost("https://example.test", "fr", id, {
    writeText: async (text: string) => {
      copied = text;
    },
  });
  expect(copied).toBe(`https://example.test/fr/home?post=${id}#home-feed`);
  await expect(
    copyHomePost("https://example.test", "en", id, undefined),
  ).rejects.toThrow();
  await expect(
    copyHomePost("https://example.test", "en", id, {
      writeText: async () => {
        throw new Error("denied");
      },
    }),
  ).rejects.toThrow("denied");
});
