import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, it, expect } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Business tests require local vq_test");
const db = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const app = buildApi(db.repository, {
  identity: db.identity,
  businesses: db.businesses,
  allowedOrigins: [origin],
});
const people: { id: string; cookie: string }[] = [];
let organizationId = "";
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 3; i++) {
    const response = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${70 + i}`,
      payload: {
        email: `business-${randomUUID()}@example.test`,
        password: "Actual-business-fixture!79",
      },
    });
    expect(response.statusCode).toBe(201);
    people.push({
      id: response.json().account.id,
      cookie: String(response.headers["set-cookie"]).split(";")[0],
    });
  }
});
afterAll(async () => {
  try {
    if (
      (
        await db.pool.query(
          "SELECT to_regclass('business_organizations') AS table_name",
        )
      ).rows[0].table_name
    )
      await db.pool.query(
        "DELETE FROM business_organizations WHERE owner_id=ANY($1::uuid[])",
        [people.map((p) => p.id)],
      );
  } finally {
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      people.map((p) => p.id),
    ]);
    await app.close();
    await db.close();
  }
});
it("creates a durable pending business without self-granted approval", async () => {
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/businesses",
        headers: { origin },
        payload: { name: "Fixture", description: "Real test business" },
      })
    ).statusCode,
  ).toBe(401);
  const spoof = await app.inject({
    method: "POST",
    url: "/v1/businesses",
    headers: { origin, cookie: people[0].cookie },
    payload: {
      name: "Fixture",
      description: "Real test business",
      status: "approved",
    },
  });
  expect(spoof.statusCode).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/businesses",
        headers: {
          origin: "https://untrusted.example",
          cookie: people[0].cookie,
        },
        payload: { name: "Rejected origin", description: "Must not persist" },
      })
    ).statusCode,
  ).toBe(403);
  const response = await app.inject({
    method: "POST",
    url: "/v1/businesses",
    headers: { origin, cookie: people[0].cookie },
    payload: {
      name: "Business integration fixture",
      description: "Removed after tests",
    },
  });
  expect(response.statusCode).toBe(201);
  organizationId = response.json().business.id;
  expect(response.json().business).toMatchObject({
    ownerId: people[0].id,
    status: "pending",
    role: "owner",
    canHostEvents: false,
    canManage: true,
  });
  const second = buildApi(db.repository, {
    identity: db.identity,
    businesses: db.businesses,
    allowedOrigins: [origin],
  });
  try {
    expect(
      (
        await second.inject({
          url: "/v1/businesses/me",
          headers: { cookie: people[0].cookie },
        })
      ).json().businesses[0].id,
    ).toBe(organizationId);
  } finally {
    await second.close();
  }
});
it("requires an owner invitation and the intended account's acceptance", async () => {
  const endpoint = `/v1/businesses/${organizationId}/members`;
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[1].cookie },
        payload: { userId: people[2].id },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[0].cookie },
        payload: { userId: people[1].id, role: "owner" },
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[0].cookie },
        payload: { userId: people[1].id },
      })
    ).statusCode,
  ).toBe(201);
  const accept = `/v1/businesses/${organizationId}/membership/accept`;
  expect(
    (
      await app.inject({
        method: "POST",
        url: accept,
        headers: { origin, cookie: people[1].cookie },
        payload: { userId: people[2].id },
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: accept,
        headers: { origin, cookie: people[2].cookie },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "POST",
        url: accept,
        headers: { origin, cookie: people[1].cookie },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: "/v1/businesses/me",
        headers: { cookie: people[1].cookie },
      })
    ).json().businesses[0],
  ).toMatchObject({
    role: "member",
    membershipStatus: "active",
    canManage: false,
    canHostEvents: false,
  });
});
it("enforces scoped review authority and records approval without granting it to members", async () => {
  const endpoint = `/v1/businesses/${organizationId}/review`;
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[0].cookie },
        payload: { decision: "approved" },
      })
    ).statusCode,
  ).toBe(403);
  // Explicit isolated test privilege, never a production administrator/bootstrap.
  await db.pool.query(
    "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'business.review')",
    [people[2].id],
  );
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[2].cookie },
        payload: { decision: "approved" },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: "/v1/businesses/me",
        headers: { cookie: people[0].cookie },
      })
    ).json().businesses[0].canHostEvents,
  ).toBe(true);
  expect(
    (
      await app.inject({
        url: "/v1/businesses/me",
        headers: { cookie: people[1].cookie },
      })
    ).json().businesses[0].canHostEvents,
  ).toBe(false);
  expect(
    (
      await db.pool.query(
        "SELECT reviewer_id,decision FROM business_reviews WHERE organization_id=$1",
        [organizationId],
      )
    ).rows[0],
  ).toMatchObject({ reviewer_id: people[2].id, decision: "approved" });
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[2].cookie },
        payload: { decision: "rejected" },
      })
    ).statusCode,
  ).toBe(409);
});
