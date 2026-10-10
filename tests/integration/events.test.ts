import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Events tests require local vq_test");
const db = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const options = {
  identity: db.identity,
  profiles: db.profiles,
  businesses: db.businesses,
  events: db.events,
  allowedOrigins: [origin],
};
const app = buildApi(db.repository, options);
const people: { id: string; cookie: string }[] = [];
let businessId = "";
let eventId = "";
const input = {
  businessId: "",
  title: "Official event fixture",
  description: "Real isolated event",
  location: "Medina, Tunis",
  tag: "music",
  startsAt: null,
  mediaIds: [],
};
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 3; i++) {
    const response = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${130 + i}`,
      payload: {
        email: `events-${randomUUID()}@example.test`,
        password: "Real-event-fixture!91",
      },
    });
    expect(response.statusCode).toBe(201);
    people.push({
      id: response.json().account.id,
      cookie: String(response.headers["set-cookie"]).split(";")[0],
    });
  }
  const created = await app.inject({
    method: "POST",
    url: "/v1/businesses",
    headers: { origin, cookie: people[0].cookie },
    payload: {
      name: "Isolated official host",
      description: "Removed after tests",
    },
  });
  businessId = created.json().business.id;
  input.businessId = businessId;
});
afterAll(async () => {
  if (
    (await db.pool.query("SELECT to_regclass('events_entries') AS name"))
      .rows[0].name
  )
    await db.pool.query(
      "DELETE FROM events_entries WHERE owner_id=ANY($1::uuid[])",
      [people.map((p) => p.id)],
    );
  await db.pool.query(
    "DELETE FROM business_organizations WHERE owner_id=ANY($1::uuid[])",
    [people.map((p) => p.id)],
  );
  await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
    people.map((p) => p.id),
  ]);
  await app.close();
  await db.close();
});
const post = (payload: object, cookie?: string) =>
  app.inject({
    method: "POST",
    url: "/v1/events",
    headers: { origin, ...(cookie ? { cookie } : {}) },
    payload,
  });
it("uses real business approval and owner authority rather than a client role switch", async () => {
  expect((await app.inject({ url: "/v1/events?tab=live" })).statusCode).toBe(
    200,
  );
  expect((await post(input)).statusCode).toBe(401);
  expect((await post(input, people[0].cookie)).statusCode).toBe(403);
  // Scoped review privilege exists only on this isolated test account in vq_test.
  await db.pool.query(
    "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'business.review')",
    [people[2].id],
  );
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/businesses/${businessId}/review`,
        headers: { origin, cookie: people[2].cookie },
        payload: { decision: "approved" },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await post({ ...input, accountType: "business" }, people[1].cookie))
      .statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/businesses/${businessId}/members`,
        headers: { origin, cookie: people[0].cookie },
        payload: { userId: people[1].id },
      })
    ).statusCode,
  ).toBe(201);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/businesses/${businessId}/membership/accept`,
        headers: { origin, cookie: people[1].cookie },
        payload: {},
      })
    ).statusCode,
  ).toBe(200);
  expect((await post(input, people[1].cookie)).statusCode).toBe(403);
  const created = await post(input, people[0].cookie);
  expect(created.statusCode).toBe(201);
  eventId = created.json().event.id;
  expect(created.json().event).toMatchObject({
    ownerId: people[0].id,
    businessId,
    hostName: "Isolated official host",
    status: "live",
  });
  const secondDb = createDatabase(url!);
  const second = buildApi(secondDb.repository, {
    ...options,
    identity: secondDb.identity,
    businesses: secondDb.businesses,
    events: secondDb.events,
  });
  try {
    expect(
      (await second.inject({ url: `/v1/events/${eventId}` })).json().event.id,
    ).toBe(eventId);
  } finally {
    await second.close();
    await secondDb.close();
  }
});
it("persists private Event bookmarks across API instances without guest writes", async () => {
  const save = (cookie?: string, saved = true) =>
    app.inject({
      method: "PUT",
      url: `/v1/events/${eventId}/save`,
      headers: { origin, ...(cookie ? { cookie } : {}) },
      payload: { saved },
    });
  expect((await save()).statusCode).toBe(401);
  expect((await save(people[1].cookie)).statusCode).toBe(200);
  expect((await save(people[1].cookie)).statusCode).toBe(200);
  const other = createDatabase(url!);
  try {
    expect((await other.events.read(eventId, people[1].id))?.saved).toBe(true);
    expect((await other.events.read(eventId))?.saved).toBe(false);
    expect((await other.events.read(eventId, people[0].id))?.saved).toBe(false);
  } finally {
    await other.close();
  }
  expect((await save(people[1].cookie, false)).statusCode).toBe(200);
  expect((await db.events.read(eventId, people[1].id))?.saved).toBe(false);
});
it("protects edits, strict input and transactional attachment rollback", async () => {
  const created = await post(
    { ...input, title: "Editable event fixture" },
    people[0].cookie,
  );
  expect(created.statusCode).toBe(201);
  const id = created.json().event.id;
  const edit = (cookie: string, payload: object) =>
    app.inject({
      method: "PUT",
      url: `/v1/events/${id}`,
      headers: { origin, cookie },
      payload,
    });
  expect(
    (await edit(people[1].cookie, { ...input, version: 1 })).statusCode,
  ).toBe(403);
  expect(
    (
      await edit(people[0].cookie, {
        ...input,
        title: "Edited official fixture",
        version: 1,
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await edit(people[0].cookie, { ...input, version: 1 })).statusCode,
  ).toBe(409);
  const before = (
    await db.pool.query(
      "SELECT count(*)::int AS count FROM events_entries WHERE owner_id=$1",
      [people[0].id],
    )
  ).rows[0].count;
  await expect(
    db.events.create(people[0].id, "Isolated official host", {
      ...input,
      tag: "music",
      mediaIds: [randomUUID()],
    }),
  ).rejects.toThrow("INVALID_EVENT_MEDIA");
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS count FROM events_entries WHERE owner_id=$1",
        [people[0].id],
      )
    ).rows[0].count,
  ).toBe(before);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/events",
        headers: {
          origin,
          cookie: people[0].cookie,
          "content-type": "application/json",
        },
        payload: "{",
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/events",
        headers: {
          origin: "https://untrusted.example",
          cookie: people[0].cookie,
        },
        payload: input,
      })
    ).statusCode,
  ).toBe(403);
});
it("supports real RSVP toggles, authenticated reviews, scheduling and owner cancellation", async () => {
  const endpoint = `/v1/events/${eventId}/rsvp`;
  expect(
    (
      await app.inject({
        method: "PUT",
        url: endpoint,
        headers: { origin },
        payload: { going: true },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: endpoint,
        headers: { origin, cookie: people[1].cookie },
        payload: { going: true },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: `/v1/events/${eventId}`,
        headers: { cookie: people[1].cookie },
      })
    ).json().event.going,
  ).toBe(true);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: endpoint,
        headers: { origin, cookie: people[1].cookie },
        payload: { going: false },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/profile/me",
        headers: { origin, cookie: people[1].cookie },
        payload: {
          name: "Actual reviewer",
          bio: "Fixture",
          handle: null,
          favoriteVibe: "Cozy",
          version: 0,
        },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/events/${eventId}/reviews`,
        headers: { origin, cookie: people[1].cookie },
        payload: { rating: 5, text: "Actual persisted review" },
      })
    ).statusCode,
  ).toBe(201);
  expect(
    (await app.inject({ url: `/v1/events/${eventId}/reviews` })).json()
      .reviews[0],
  ).toMatchObject({
    author: "Actual reviewer",
    text: "Actual persisted review",
  });
  expect(
    (
      await post(
        { ...input, startsAt: new Date(Date.now() - 1000).toISOString() },
        people[0].cookie,
      )
    ).statusCode,
  ).toBe(422);
  expect(
    (await post({ ...input, mediaIds: [randomUUID()] }, people[0].cookie))
      .statusCode,
  ).toBe(422);
  const scheduled = await post(
    {
      ...input,
      title: "Scheduled official fixture",
      startsAt: new Date(Date.now() + 3600000).toISOString(),
    },
    people[0].cookie,
  );
  expect(scheduled.statusCode).toBe(201);
  expect(
    (await app.inject({ url: "/v1/events?tab=upcoming" }))
      .json()
      .events.some((e: { id: string }) => e.id === scheduled.json().event.id),
  ).toBe(true);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/events/${eventId}/cancel`,
        headers: { origin, cookie: people[1].cookie },
        payload: { version: 1 },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/events/${eventId}/cancel`,
        headers: { origin, cookie: people[0].cookie },
        payload: { version: 1 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await app.inject({ url: `/v1/events/${eventId}` })).json().event.status,
  ).toBe("cancelled");
});
it("transitions on the actual PostgreSQL clock and rejects participation after cancellation", async () => {
  const created = await post(
    {
      ...input,
      title: "Clock lifecycle fixture",
      startsAt: new Date(Date.now() + 2500).toISOString(),
    },
    people[0].cookie,
  );
  expect(created.statusCode).toBe(201);
  const event = created.json().event;
  expect(event.status).toBe("upcoming");
  await vi.waitFor(
    async () => {
      expect(
        (await app.inject({ url: `/v1/events/${event.id}` })).json().event
          .status,
      ).toBe("live");
    },
    { timeout: 6000, interval: 100 },
  );
  expect(
    (await app.inject({ url: "/v1/events?tab=live" }))
      .json()
      .events.some((item: { id: string }) => item.id === event.id),
  ).toBe(true);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/events/${event.id}`,
        headers: { origin, cookie: people[0].cookie },
        payload: {
          ...input,
          startsAt: new Date(Date.now() + 3600000).toISOString(),
          version: 1,
        },
      })
    ).statusCode,
  ).toBe(422);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/events/${event.id}/cancel`,
        headers: { origin, cookie: people[0].cookie },
        payload: { version: 1 },
      })
    ).statusCode,
  ).toBe(200);
  for (const [action, payload] of [
    ["rsvp", { going: true }],
    ["save", { saved: true }],
  ] as const) {
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/v1/events/${event.id}/${action}`,
          headers: { origin, cookie: people[1].cookie },
          payload,
        })
      ).statusCode,
    ).toBe(409);
  }
});
