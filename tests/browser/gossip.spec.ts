import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { browserDatabase } from "./browser-database";
import { setTheme } from "./profile-controls";

test("R07 original composer publishes real My Network Gossip and preserves authorized lifecycle", async ({
  page,
}) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(10000);
  const db = browserDatabase();
  let userId = "";
  try {
    await page.goto("/en/vibe");
    const r = await page.request.post("/api/v1/identity/register", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        email: `gossip-ui-${randomUUID()}@example.test`,
        password: "Gossip-browser!99",
      },
    });
    expect(r.status()).toBe(201);
    userId = (await r.json()).account.id;
    await page.reload();
    await page.locator(".capsule-title").click();
    const composer = page.getByRole("dialog", { name: "Voyager Composer" });
    await expect(composer.getByLabel("Your post")).toBeVisible();
    await expect(
      composer.getByLabel("Local Vibes", { exact: true }),
    ).toBeDisabled();
    await expect(
      composer.getByLabel("Local Vibes", { exact: true }),
    ).not.toBeChecked();
    await expect(composer.locator(".gossip-emojis button")).toHaveCount(6);
    await composer.getByLabel("Your post").fill("a".repeat(250));
    await expect(composer.locator(".gossip-counter")).toHaveAttribute(
      "data-warning",
      "true",
    );
    await composer.getByLabel("Your post").fill("a".repeat(279));
    await composer.getByRole("button", { name: "🔥", exact: true }).click();
    await expect(composer.getByLabel("Your post")).toHaveValue("a".repeat(279));
    const text = `Published Gossip ${randomUUID()}`;
    await composer.getByLabel("Your post").fill(text);
    await composer.getByLabel("Custom location label").fill("A chosen label");
    await expect(composer.getByLabel("Custom location label")).toHaveAttribute(
      "maxlength",
      "40",
    );
    await composer.getByLabel("Image", { exact: true }).setInputFiles({
      name: "actual.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await expect(composer.locator(".gossip-preview img")).toBeVisible();
    await composer.getByRole("button", { name: "Remove image" }).click();
    await expect(composer.locator(".gossip-preview img")).toHaveCount(0);
    await composer.getByLabel("Image", { exact: true }).setInputFiles({
      name: "published.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await composer.getByLabel("My Network", { exact: true }).uncheck();
    await expect(
      composer.getByRole("button", { name: "Publish", exact: true }),
    ).toBeDisabled();
    await composer.getByLabel("My Network", { exact: true }).check();
    await composer
      .getByRole("button", { name: "Publish", exact: true })
      .click();
    await expect(composer).toHaveCount(0);
    await expect(
      page.locator(".gossip-post").filter({ hasText: text }),
    ).toBeVisible();
    await page.reload();
    let card = page.locator(".gossip-post").filter({ hasText: text });
    await expect(card).toBeVisible();
    await expect(card.locator(".gossip-image")).toBeVisible();
    await expect
      .poll(() =>
        card
          .locator(".gossip-image")
          .evaluate(
            (node) =>
              node instanceof HTMLImageElement &&
              node.complete &&
              node.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await card.getByRole("button", { name: "Like", exact: true }).click();
    await expect(
      card.getByRole("button", { name: "Unlike", exact: true }),
    ).toBeVisible();
    await card.getByRole("button", { name: "Comments", exact: true }).click();
    await card
      .getByLabel("Comment", { exact: true })
      .fill("A persisted comment");
    await card.getByRole("button", { name: "Send comment" }).click();
    await expect(
      card.getByText("A persisted comment", { exact: true }),
    ).toBeVisible();
    await page.reload();
    card = page.locator(".gossip-post").filter({ hasText: text });
    await expect(
      card.getByRole("button", { name: "Unlike", exact: true }),
    ).toBeVisible();
    await card.getByRole("button", { name: "Comments", exact: true }).click();
    await expect(
      card.getByText("A persisted comment", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".gossip-toolbar")
        .getByRole("button", { name: "Content moderation", exact: true }),
    ).toHaveCount(0);
    await card
      .getByRole("button", { name: "Report post", exact: true })
      .click();
    await card
      .getByRole("combobox", { name: "Reason", exact: true })
      .selectOption("other");
    const reportResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/reports") &&
        response.request().method() === "POST",
    );
    await card
      .getByRole("button", { name: "Send report", exact: true })
      .click();
    const reportId = (await (await reportResponse).json()).report.id;
    await expect(card).toBeVisible();
    await expect(
      card.getByText(
        "Report received. Reporting does not automatically hide content.",
        { exact: true },
      ),
    ).toBeVisible();
    await card.getByRole("button", { name: "Edit", exact: true }).click();
    await composer.getByLabel("Visibility").selectOption("FOLLOWERS_ONLY");
    await composer.getByLabel("Your post").fill(`${text} edited`);
    await composer.getByRole("button", { name: "Save", exact: true }).click();
    card = page.locator(".gossip-post").filter({ hasText: `${text} edited` });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Delete post" }).click();
    await card
      .getByRole("button", { name: "Confirm deletion", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    await page.getByRole("button", { name: "Deleted posts" }).click();
    const deleted = page
      .locator(".gossip-deleted")
      .filter({ hasText: `${text} edited` });
    await deleted.getByRole("button", { name: "Restore" }).click();
    await expect(
      page.locator(".gossip-post").filter({ hasText: `${text} edited` }),
    ).toBeVisible();
    for (const locale of ["en", "fr", "es", "ar"]) {
      await page.setViewportSize({ width: 375, height: 812 });
      for (const theme of ["light", "dark"]) {
        await page.goto(`/${locale}/vibe`);
        await setTheme(page, theme);
        await page.locator(".capsule-title").click();
        await expect(
          page.locator(".gossip-composer #gossip-text"),
        ).toBeVisible();
        await expect(
          page.locator(".gossip-composer .gossip-publish"),
        ).toBeInViewport();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (locale === "ar")
          await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        await page.screenshot({
          path: `.local/r07/gossip-${locale}-${theme}.png`,
        });
        await page.keyboard.press("Escape");
      }
    }
    // Temporary local fixture permission only; no application grant/bootstrap.
    await db.pool.query(
      "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'content.moderate')",
      [userId],
    );
    await page.goto("/en/vibe");
    await page
      .locator(".gossip-toolbar")
      .getByRole("button", { name: "Content moderation", exact: true })
      .click();
    await page
      .locator(".gossip-moderation")
      .getByRole("button", { name: new RegExp(reportId) })
      .click();
    await expect(page.locator(".gossip-moderation pre")).toContainText(text);
    await expect(page.locator(".gossip-moderation pre")).not.toContainText(
      "mediaId",
    );
    await page
      .getByRole("button", { name: "Hide reported content", exact: true })
      .click();
    await expect(
      page.locator(".gossip-post").filter({ hasText: `${text} edited` }),
    ).toHaveCount(0);
  } finally {
    if (userId) {
      await db.pool.query("DELETE FROM content_reports WHERE reporter_id=$1", [
        userId,
      ]);
      const images = (
        await db.pool.query<{ media_id: string }>(
          "SELECT media_id FROM content_posts WHERE author_id=$1 AND media_id IS NOT NULL",
          [userId],
        )
      ).rows;
      await db.pool.query("DELETE FROM content_posts WHERE author_id=$1", [
        userId,
      ]);
      for (const image of images)
        await page.request.delete(`/api/v1/media/${image.media_id}`, {
          headers: { origin: "http://127.0.0.1:3000" },
        });
      await db.pool.query("DELETE FROM identity_users WHERE id=$1", [userId]);
    }
    await db.close();
  }
});
