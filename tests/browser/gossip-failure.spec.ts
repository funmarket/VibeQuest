import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { browserDatabase } from "./browser-database";

test("failed publication preserves the draft and retires its new image without fabricating a post", async ({
  page,
}) => {
  const db = browserDatabase();
  let userId = "";
  try {
    await page.goto("/en/vibe");
    const registered = await page.request.post("/api/v1/identity/register", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        email: `gossip-failure-${randomUUID()}@example.test`,
        password: "Gossip-failure!99",
      },
    });
    expect(registered.status()).toBe(201);
    userId = (await registered.json()).account.id;
    await page.reload();
    await page.locator(".capsule-title").click();
    const composer = page.getByRole("dialog", { name: "Voyager Composer" });
    await composer.getByLabel("Your post").fill("Keep this real draft");
    await composer.getByLabel("Image", { exact: true }).setInputFiles({
      name: "real.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await page.route("**/api/v1/content/me/posts", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ code: "CONTENT_UNAVAILABLE" }),
          })
        : route.continue(),
    );
    const upload = page.waitForResponse(
      (response) =>
        /\/api\/v1\/media\/uploads\/[^/]+$/.test(response.url()) &&
        response.request().method() === "PUT",
    );
    await composer
      .getByRole("button", { name: "Publish", exact: true })
      .click();
    const mediaId = (await (await upload).json()).media.id;
    await expect(composer.getByRole("alert")).toBeVisible();
    await expect(composer.getByLabel("Your post")).toHaveValue(
      "Keep this real draft",
    );
    expect(
      (
        await db.pool.query("SELECT id FROM content_posts WHERE author_id=$1", [
          userId,
        ])
      ).rowCount,
    ).toBe(0);
    expect(await db.media.read(mediaId)).toBe(null);
    expect(
      (
        await db.pool.query(
          "SELECT completed_at IS NOT NULL AS completed FROM media_cleanup_jobs WHERE object_id=$1",
          [mediaId],
        )
      ).rows[0].completed,
    ).toBe(true);
  } finally {
    if (userId)
      await db.pool.query("DELETE FROM identity_users WHERE id=$1", [userId]);
    await db.close();
  }
});
