import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname) ||
  new URL(url).pathname !== "/vq_test"
)
  throw new Error("Profile tests require local vq_test");
const db = createDatabase(url);
const otherDb = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const options = {
  identity: db.identity,
  profiles: db.profiles,
  allowedOrigins: [origin],
};
const app = buildApi(db.repository, options);
const other = buildApi(otherDb.repository, {
  identity: otherDb.identity,
  profiles: otherDb.profiles,
  allowedOrigins: [origin],
});
const people: { id: string; cookie: string }[] = [];
const base = {
  name: "Private voyager",
  bio: "Real biography",
  handle: null,
  favoriteVibe: "Cozy",
  version: 0,
};
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 2; i++) {
    const result = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      remoteAddress: `127.0.0.${210 + i}`,
      headers: { origin },
      payload: {
        email: `profile-${randomUUID()}@example.test`,
        password: "Profile-regression-password!79",
      },
    });
    expect(result.statusCode).toBe(201);
    people.push({
      id: result.json().account.id,
      cookie: String(result.headers["set-cookie"]).split(";")[0],
    });
  }
});
afterAll(async () => {
  await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
    people.map((person) => person.id),
  ]);
  await app.close();
  await other.close();
  await db.close();
  await otherDb.close();
});
it("rejects unauthorized/unknown-field writes and strict handle queries", async () => {
  expect(
    (await app.inject({ url: "/v1/profile/handle?handle=valid" })).statusCode,
  ).toBe(401);
  expect((await app.inject({ url: "/v1/profile/me" })).statusCode).toBe(401);
  for (const query of [
    "handle=a",
    "handle=valid&userId=spoof",
    "handle=valid&handle=other",
  ]) {
    expect(
      (
        await app.inject({
          url: `/v1/profile/handle?${query}`,
          headers: { cookie: people[0].cookie },
        })
      ).statusCode,
    ).toBe(400);
  }
  for (const extra of [
    { userId: people[1].id },
    { contactMethod: "sms" },
    { contactEmail: "invalid" },
    { telegramHandle: "https://t.me/user" },
    { phoneNumber: "letters" },
  ]) {
    expect(
      (
        await app.inject({
          method: "PUT",
          url: "/v1/profile/me",
          headers: { origin, cookie: people[0].cookie },
          payload: { ...base, ...extra },
        })
      ).statusCode,
    ).toBe(400);
  }
});
it("persists normalized private data across API/database instances; old writes preserve new fields", async () => {
  const input = {
    ...base,
    interests: [" WEB3 ", "web3", "Coffee Seeker"],
    location: "Private city",
    contactMethod: "email",
    contactEmail: "contact@example.test",
    phoneNumber: "+216 123-456",
    xHandle: "@traveler",
    telegramHandle: "@voyager",
    cozyDiary: true,
  };
  const saved = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie: people[0].cookie },
    payload: input,
  });
  expect(saved.statusCode).toBe(200);
  const profile = saved.json().profile;
  expect(profile).toMatchObject({
    interests: ["web3", "coffee-seeker"],
    completed: true,
    xHandle: "traveler",
    telegramHandle: "voyager",
    cozyDiary: true,
    version: 1,
  });
  expect(
    (
      await other.inject({
        url: "/v1/profile/me",
        headers: { cookie: people[0].cookie },
      })
    ).json().profile,
  ).toEqual(profile);
  const legacySave = await other.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie: people[0].cookie },
    payload: { ...base, version: 1, bio: "" },
  });
  expect(legacySave.json().profile).toMatchObject({
    interests: ["web3", "coffee-seeker"],
    completed: false,
    contactEmail: input.contactEmail,
    cozyDiary: true,
  });
  const publicProfile = (await db.profiles.publicMany([people[0].id]))[0];
  expect(Object.keys(publicProfile).sort()).toEqual([
    "bio",
    "handle",
    "id",
    "name",
  ]);
  const publicResponse = await other.inject({
    url: `/v1/public-profiles/id/${people[0].id}`,
  });
  expect(publicResponse.statusCode).toBe(200);
  expect(publicResponse.json()).toEqual({ profile: publicProfile });
  expect(
    (
      await app.inject({
        url: "/v1/profile/me",
        headers: { cookie: people[1].cookie },
      })
    ).json().profile,
  ).toBeNull();
});
it("keeps handle claims atomic, excludes the owner and rejects stale versions without overwriting", async () => {
  const handle = `race_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const results = await Promise.all(
    people.map((person, index) =>
      (index ? app : other).inject({
        method: "PUT",
        url: "/v1/profile/me",
        headers: { origin, cookie: person.cookie },
        payload: { ...base, version: index ? 0 : 2, handle },
      }),
    ),
  );
  expect(results.map((result) => result.statusCode).sort()).toEqual([200, 409]);
  const winnerIndex = results.findIndex((result) => result.statusCode === 200);
  const winner = people[winnerIndex];
  const loser = people[1 - winnerIndex];
  expect(results[1 - winnerIndex].json().code).toBe("HANDLE_UNAVAILABLE");
  expect(
    (
      await app.inject({
        url: `/v1/profile/handle?handle=${handle.toUpperCase()}`,
        headers: { cookie: winner.cookie },
      })
    ).json(),
  ).toEqual({ available: true });
  expect(
    (
      await other.inject({
        url: `/v1/profile/handle?handle=${handle}`,
        headers: { cookie: loser.cookie },
      })
    ).json(),
  ).toEqual({ available: false });
  const profile = results[winnerIndex].json().profile;
  const stale = await other.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie: winner.cookie },
    payload: {
      ...base,
      name: "Overwrite attempt",
      handle,
      version: profile.version - 1,
    },
  });
  expect(stale.statusCode).toBe(409);
  expect(stale.json().code).toBe("STALE_PROFILE");
  expect((await db.profiles.read(winner.id))?.name).toBe(base.name);
});
