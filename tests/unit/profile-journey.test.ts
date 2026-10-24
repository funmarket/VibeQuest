import { afterEach, expect, it, vi } from "vitest";
import { profileInputSchema, profileInterestPresets } from "@vq/contracts";
import { profileHandleAvailable, attachProfilePhoto } from "@vq/api-client";

const base = {
  name: "Voyager",
  bio: "",
  handle: null,
  favoriteVibe: "Cozy",
  version: 0,
};
afterEach(() => vi.unstubAllGlobals());
it("retains the exact original ten preset labels and order", () => {
  expect(profileInterestPresets).toEqual([
    "cyberpunk",
    "web3",
    "solana",
    "neon",
    "tokyo",
    "tunis",
    "coffee-seeker",
    "retro-gaming",
    "cultural-pass",
    "minimalist",
  ]);
});
it("never turns failed or malformed handle checks into available", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockResolvedValueOnce(
    new Response(JSON.stringify({ available: true }), { status: 503 }),
  );
  await expect(profileHandleAvailable("/api", "valid_handle")).rejects.toThrow(
    "HANDLE_CHECK_UNAVAILABLE",
  );
  fetcher.mockResolvedValueOnce(
    new Response(JSON.stringify({ available: "yes" })),
  );
  await expect(
    profileHandleAvailable("/api", "valid_handle"),
  ).rejects.toThrow();
  fetcher.mockResolvedValueOnce(
    new Response(JSON.stringify({ available: false })),
  );
  await expect(profileHandleAvailable("/api", "VALID_HANDLE")).resolves.toBe(
    false,
  );
  expect(fetcher.mock.lastCall?.[0]).toBe(
    "/api/v1/profile/handle?handle=valid_handle",
  );
});
it("preserves the authoritative stale-photo error for safe profile reload", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "STALE_PROFILE" }), {
        status: 409,
      }),
    ),
  );
  await expect(attachProfilePhoto("/api", null, 1)).rejects.toThrow(
    "STALE_PROFILE",
  );
});
it("normalizes and deduplicates private interests without changing completion requirements", () => {
  const parsed = profileInputSchema.parse({
    ...base,
    interests: [" WEB3 ", "web3", "Coffee Seeker"],
  });
  expect(parsed.interests).toEqual(["web3", "coffee-seeker"]);
});
it("validates contact protocol and Cozy Diary fields without granting privileges", () => {
  expect(
    profileInputSchema.safeParse({ ...base, contactMethod: "sms" }).success,
  ).toBe(false);
  expect(
    profileInputSchema.safeParse({ ...base, cozyDiary: true }).success,
  ).toBe(true);
  expect(
    profileInputSchema.safeParse({ ...base, contactEmail: "invalid" }).success,
  ).toBe(false);
  expect(
    profileInputSchema.safeParse({
      ...base,
      telegramHandle: "https://t.me/user",
    }).success,
  ).toBe(false);
});
