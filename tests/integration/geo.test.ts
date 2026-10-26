import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";

const url = new URL(process.env.TEST_DATABASE_URL ?? "invalid:");
if (
  url.pathname !== "/vq_test" ||
  !["127.0.0.1", "localhost"].includes(url.hostname)
)
  throw Error("Geo tests require local vq_test");
const db = createDatabase(url.href);
const app = buildApi(db.repository, {
  identity: db.identity,
  geo: db.geo,
  secureCookies: false,
  allowedOrigins: ["http://127.0.0.1:3000"],
});
let cookie = "",
  id = "";
const headers = () => ({ origin: "http://127.0.0.1:3000", cookie });
beforeAll(async () => {
  await migrate(db.pool);
  const r = await app.inject({
    method: "POST",
    url: "/v1/identity/register",
    headers: headers(),
    payload: {
      email: `geo-${randomUUID()}@example.test`,
      password: "Geo-test-account!99",
    },
  });
  expect(r.statusCode).toBe(201);
  cookie = String(r.headers["set-cookie"]).split(";")[0];
  id = r.json().account.id;
});
it("requires authentication and returns remembered consent without inventing a position", async () => {
  expect((await app.inject({ url: "/v1/geo/me" })).statusCode).toBe(401);
  const r = await app.inject({ url: "/v1/geo/me", headers: headers() });
  expect(r.statusCode).toBe(200);
  expect(r.json()).toMatchObject({
    decided: false,
    locationConsent: false,
    socialSharing: false,
    presence: null,
    version: 0,
  });
});

async function state() {
  return (await app.inject({ url: "/v1/geo/me", headers: headers() })).json();
}
async function consent(locationConsent = true, socialSharing = false) {
  const current = await state();
  return app.inject({
    method: "PUT",
    url: "/v1/geo/me/consent",
    headers: headers(),
    payload: { version: current.version, locationConsent, socialSharing },
  });
}
const reading = () => ({
  latitude: 36.81,
  longitude: 10.18,
  accuracy: 100,
  observedAt: new Date().toISOString(),
});

it("persists consent, rejects stale preference edits and never grants sharing implicitly", async () => {
  const r = await consent();
  expect(r.statusCode).toBe(200);
  expect(r.json()).toMatchObject({
    decided: true,
    locationConsent: true,
    socialSharing: false,
  });
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/geo/me/consent",
        headers: headers(),
        payload: { version: 0, locationConsent: false, socialSharing: false },
      })
    ).statusCode,
  ).toBe(409);
});
it("enforces reading and ownership validation without silently accepting unreliable fixes", async () => {
  await consent();
  const version = (await state()).version;
  const send = (extra: object) =>
    app.inject({
      method: "PUT",
      url: "/v1/geo/me/observation",
      headers: headers(),
      payload: { version, ...reading(), ...extra },
    });
  for (const extra of [
    { accuracy: 100.01 },
    { accuracy: -1 },
    { accuracy: null },
    { observedAt: new Date(Date.now() + 60000).toISOString() },
    { observedAt: new Date(Date.now() - 300001).toISOString() },
    { latitude: 91 },
    { userId: randomUUID() },
  ])
    expect((await send(extra)).statusCode).toBe(400);
  expect((await send({})).statusCode).toBe(200);
  const second = await send({ latitude: 36.82 });
  expect(second.statusCode).toBe(200);
  expect(second.json().presence.latitude).toBe(36.82);
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(1);
  expect(
    (
      await app.inject({
        url: `/v1/geo/users/${randomUUID()}/area`,
        headers: headers(),
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (await send({ observedAt: new Date(Date.now() - 1000).toISOString() }))
      .statusCode,
  ).toBe(409);
});
it("denies expired reads before cleanup and does not confuse social-only withdrawal with private consent", async () => {
  await consent(true, true);
  const version = (await state()).version;
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/geo/me/observation",
        headers: headers(),
        payload: { version, ...reading() },
      })
    ).statusCode,
  ).toBe(200);
  expect((await consent(true, false)).json().presence).not.toBeNull();
  await db.pool.query(
    "UPDATE geo_positions SET observed_at=now()-interval '16 minutes',accepted_at=now()-interval '16 minutes',expires_at=now()-interval '1 second' WHERE user_id=$1",
    [id],
  );
  expect((await state()).presence).toBeNull();
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(1);
  await db.geo.cleanup();
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(0);
  expect((await consent(false)).json()).toMatchObject({
    locationConsent: false,
    socialSharing: false,
    presence: null,
  });
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(0);
});
it("treats the same observation idempotently without extending its validity clock", async () => {
  await consent();
  const payload = { version: (await state()).version, ...reading() };
  const send = () =>
    app.inject({
      method: "PUT",
      url: "/v1/geo/me/observation",
      headers: headers(),
      payload,
    });
  const first = await send(),
    second = await send();
  expect(first.statusCode).toBe(200);
  expect(second.statusCode).toBe(200);
  expect(second.json().presence.expiresAt).toBe(
    first.json().presence.expiresAt,
  );
});
it("platform loss clears coordinates while preserving the remembered preference and rejects in-flight old observations", async () => {
  await consent();
  const old = (await state()).version;
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/geo/me/unavailable",
        headers: headers(),
        payload: {},
      })
    ).statusCode,
  ).toBe(200);
  expect(await state()).toMatchObject({
    locationConsent: true,
    presence: null,
  });
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/geo/me/observation",
        headers: headers(),
        payload: { version: old, ...reading() },
      })
    ).statusCode,
  ).toBe(409);
});
it("queries canonical Places from private server-held presence without GPS in request URLs", async () => {
  await consent();
  const version = (await state()).version;
  await app.inject({
    method: "PUT",
    url: "/v1/geo/me/observation",
    headers: headers(),
    payload: { version, ...reading() },
  });
  const placeId = randomUUID(),
    name = `R09 venue ${placeId}`;
  try {
    await db.pool.query(
      "INSERT INTO places(id,name,category,location,publication_status) VALUES($1,$2,'cafe',ST_SetSRID(ST_MakePoint(10.18,36.81),4326),'published')",
      [placeId, name],
    );
    const response = await app.inject({
      url: `/v1/geo/me/places?q=${encodeURIComponent(name)}`,
      headers: headers(),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().places.map((p: { id: string }) => p.id)).toEqual([
      placeId,
    ]);
    expect(
      (
        await app.inject({
          url: "/v1/geo/me/places?latitude=36.81",
          headers: headers(),
        })
      ).statusCode,
    ).toBe(400);
  } finally {
    await db.pool.query("DELETE FROM places WHERE id=$1", [placeId]);
  }
});
it("serializes withdrawal against an in-flight observation without restoring coordinates", async () => {
  await consent();
  const version = (await state()).version;
  const [withdraw, position] = await Promise.all([
    app.inject({
      method: "PUT",
      url: "/v1/geo/me/consent",
      headers: headers(),
      payload: { version, locationConsent: false, socialSharing: false },
    }),
    app.inject({
      method: "PUT",
      url: "/v1/geo/me/observation",
      headers: headers(),
      payload: { version, ...reading() },
    }),
  ]);
  expect(withdraw.statusCode).toBe(200);
  expect([200, 409]).toContain(position.statusCode);
  expect(await state()).toMatchObject({
    locationConsent: false,
    presence: null,
  });
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(0);
});
it("logout clears its participation, preserves an authorized other session, then deletes the last position", async () => {
  await consent();
  const email = (
    await app.inject({ url: "/v1/identity/me", headers: headers() })
  ).json().account.email;
  const login = await app.inject({
    method: "POST",
    url: "/v1/identity/login",
    headers: headers(),
    payload: { email, password: "Geo-test-account!99" },
  });
  const otherCookie = String(login.headers["set-cookie"]).split(";")[0];
  for (const activeCookie of [cookie, otherCookie])
    expect(
      (
        await app.inject({
          method: "PUT",
          url: "/v1/geo/me/observation",
          headers: { ...headers(), cookie: activeCookie },
          payload: { version: (await state()).version, ...reading() },
        })
      ).statusCode,
    ).toBe(200);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/identity/logout",
        headers: headers(),
      })
    ).statusCode,
  ).toBe(204);
  cookie = otherCookie;
  expect((await state()).presence).not.toBeNull();
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/identity/logout",
        headers: headers(),
      })
    ).statusCode,
  ).toBe(204);
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS n FROM geo_positions WHERE user_id=$1",
        [id],
      )
    ).rows[0].n,
  ).toBe(0);
});
afterAll(async () => {
  await app.close();
  if (id) await db.pool.query("DELETE FROM identity_users WHERE id=$1", [id]);
  await db.close();
});
