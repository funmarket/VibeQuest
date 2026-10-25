import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { browserDatabase } from "./browser-database";

// Author API proof through actual Chrome + Web rewrite. This is not Gossip UI
// acceptance: that journey depends on the remaining D02 policy decisions.
test("author text lifecycle persists through the real same-origin Chrome transport", async ({
  page,
}) => {
  const db = browserDatabase();
  let userId = "";
  try {
    await page.goto("/en/vibe");
    const registration = await page.request.post("/api/v1/identity/register", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        email: `r07-${randomUUID()}@example.test`,
        password: "R07-browser-password!79",
      },
    });
    expect(registration.status()).toBe(201);
    userId = (await registration.json()).account.id;
    const created = await page.evaluate(async () => {
      const response = await fetch("/api/v1/content/me/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Chrome persisted text",
          locationLabel: "User label",
          audience: "FOLLOWERS_ONLY",
        }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(created.status).toBe(201);
    const id = created.body.post.id;
    await page.reload();
    expect(
      await page.evaluate(
        async (id) =>
          (await (await fetch(`/api/v1/content/me/posts/${id}`)).json()).post
            .text,
        id,
      ),
    ).toBe("Chrome persisted text");
    const statuses = await page.evaluate(async (id) => {
      const call = async (path: string, method: string, body: unknown) =>
        (
          await fetch(`/api/v1/content/me/posts/${id}${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        ).status;
      return [
        await call("", "PUT", {
          text: "Updated in Chrome",
          locationLabel: "",
          version: 1,
        }),
        await call("", "DELETE", { version: 2 }),
        (await fetch(`/api/v1/content/me/posts/${id}`)).status,
        await call("/restore", "POST", { version: 3 }),
      ];
    }, id);
    expect(statuses).toEqual([200, 200, 404, 200]);
    const guest = await page.context().browser()!.newContext();
    try {
      const guestPage = await guest.newPage();
      await guestPage.goto("/en/vibe");
      expect(
        await guestPage.evaluate(
          async (id) => (await fetch(`/api/v1/content/me/posts/${id}`)).status,
          id,
        ),
      ).toBe(401);
    } finally {
      await guest.close();
    }
  } finally {
    if (userId)
      await db.pool.query("DELETE FROM identity_users WHERE id=$1", [userId]);
    await db.close();
  }
});
