import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
  new URL(url).pathname !== "/vq_test"
)
  throw new Error(
    "Identity tests require the explicitly selected local vq_test database.",
  );
const database = createDatabase(url);
const app = buildApi(database.repository, {
  identity: database.identity,
  profiles: database.profiles,
  allowedOrigins: ["http://127.0.0.1:3000"],
});
const email = `identity-${randomUUID()}@example.test`;
const password = "Genuine-test-account!79";
const headers = { origin: "http://127.0.0.1:3000" };
let cookie = "";
let profileVersion = 0;

beforeAll(async () => {
  await migrate(database.pool);
});
afterAll(async () => {
  await database.pool.query(
    "DELETE FROM identity_users WHERE id IN (SELECT user_id FROM identity_password_accounts WHERE email = $1)",
    [email],
  );
  await app.close();
  await database.close();
});

it("registers a persisted account with a hashed password and HttpOnly session", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/v1/identity/register",
    headers,
    payload: { email, password },
  });
  expect(response.statusCode).toBe(201);
  expect(response.json().account).toMatchObject({
    email,
    emailVerified: false,
  });
  expect(response.json()).not.toHaveProperty("token");
  const raw = String(response.headers["set-cookie"]);
  expect(raw).toContain("HttpOnly");
  expect(raw).toContain("SameSite=Lax");
  cookie = raw.split(";")[0];
  const stored = await database.pool.query(
    "SELECT password_hash FROM identity_password_accounts WHERE email = $1",
    [email],
  );
  expect(stored.rows[0].password_hash).toMatch(/^scrypt\$/);
  expect(stored.rows[0].password_hash).not.toContain(password);
  expect(
    (await app.inject({ url: "/v1/identity/me", headers: { cookie } })).json()
      .account.email,
  ).toBe(email);
});

it("rejects cross-origin writes before creating an account", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/v1/identity/register",
    headers: { origin: "https://attacker.example" },
    payload: { email, password },
  });
  expect(response.statusCode).toBe(403);
});

it("rejects duplicate registration without creating an orphan user", async () => {
  const before = await database.pool.query(
    "SELECT count(*)::int AS n FROM identity_users u WHERE NOT EXISTS(SELECT 1 FROM identity_password_accounts a WHERE a.user_id=u.id)",
  );
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/identity/register",
        headers,
        payload: { email, password },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await database.pool.query(
        "SELECT count(*)::int AS n FROM identity_users u WHERE NOT EXISTS(SELECT 1 FROM identity_password_accounts a WHERE a.user_id=u.id)",
      )
    ).rows,
  ).toEqual(before.rows);
});

it("rejects incorrect credentials and revokes a real session on logout", async () => {
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/identity/login",
        headers,
        payload: { email, password: "Incorrect-password!79" },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/identity/logout",
        headers: { ...headers, cookie },
      })
    ).statusCode,
  ).toBe(204);
  expect(
    (await app.inject({ url: "/v1/identity/me", headers: { cookie } })).json(),
  ).toEqual({ account: null });
});

it("requires a real session to read or edit a profile", async () => {
  expect((await app.inject({ url: "/v1/profile/me" })).statusCode).toBe(401);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/profile/me",
        headers,
        payload: {
          name: "Test profile",
          bio: "Real database test",
          handle: null,
          favoriteVibe: "Cozy",
          version: 0,
        },
      })
    ).statusCode,
  ).toBe(401);
});

it("persists profile completion and rejects stale concurrent edits", async () => {
  const login = await app.inject({
    method: "POST",
    url: "/v1/identity/login",
    headers,
    payload: { email, password },
  });
  cookie = String(login.headers["set-cookie"]).split(";")[0];
  const input = {
    name: "Test profile",
    bio: "Real database test",
    handle: `test_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
    favoriteVibe: "Cozy",
    version: 0,
  };
  const saved = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { ...headers, cookie },
    payload: input,
  });
  expect(saved.statusCode).toBe(200);
  expect(saved.json().profile).toMatchObject({
    name: input.name,
    bio: input.bio,
    completed: true,
    version: 1,
  });
  profileVersion = saved.json().profile.version;
  expect(
    (await app.inject({ url: "/v1/profile/me", headers: { cookie } })).json()
      .profile,
  ).toEqual(saved.json().profile);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/profile/me",
        headers: { ...headers, cookie },
        payload: input,
      })
    ).statusCode,
  ).toBe(409);
  const incomplete = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { ...headers, cookie },
    payload: { ...input, bio: "", version: profileVersion },
  });
  expect(incomplete.json().profile.completed).toBe(false);
});

it("logs in through a separate API instance and enforces database expiry", async () => {
  const other = buildApi(database.repository, {
    identity: database.identity,
    allowedOrigins: [headers.origin],
  });
  try {
    const login = await other.inject({
      method: "POST",
      url: "/v1/identity/login",
      headers,
      payload: { email: email.toUpperCase(), password },
    });
    expect(login.statusCode).toBe(200);
    cookie = String(login.headers["set-cookie"]).split(";")[0];
    expect(
      (
        await other.inject({ url: "/v1/identity/me", headers: { cookie } })
      ).json().account.email,
    ).toBe(email);
    await database.pool.query(
      "UPDATE identity_sessions SET expires_at = now() - interval '1 second' WHERE user_id IN (SELECT user_id FROM identity_password_accounts WHERE email = $1)",
      [email],
    );
    expect(
      (
        await other.inject({ url: "/v1/identity/me", headers: { cookie } })
      ).json(),
    ).toEqual({ account: null });
  } finally {
    await other.close();
  }
});
