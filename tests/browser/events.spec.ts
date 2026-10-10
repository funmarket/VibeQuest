import { randomUUID } from "node:crypto";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { createDatabase } from "../../packages/database/src/index";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
test.skip(
  ({ baseURL }) => baseURL !== "http://127.0.0.1:3002",
  "Requires the isolated real Events API/database configuration.",
);
test("real approved-business hosting, images, public discovery, RSVP, reviews and cancellation", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const db = createDatabase("postgresql://vq_local@127.0.0.1:55439/vq_test");
  const origin = "http://127.0.0.1:3002";
  const emails = [
    `event-host-${randomUUID()}@example.test`,
    `event-reviewer-${randomUUID()}@example.test`,
  ];
  const businessName = `Chrome official host ${randomUUID().slice(0, 8)}`;
  const title = `Chrome official event ${randomUUID().slice(0, 8)}`;
  const reviewContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  try {
    await page.goto("/en/home");
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    const menu = page.getByRole("dialog");
    await menu.getByText("Appearance", { exact: true }).click();
    await menu
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption("dark");
    await menu
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await menu.getByLabel("Email", { exact: true }).fill(emails[0]);
    await menu
      .getByLabel("Password", { exact: true })
      .fill("Real-event-browser!95");
    await menu.getByRole("button", { name: "Register", exact: true }).click();
    await expect(menu.getByText(emails[0], { exact: true })).toBeVisible();
    await menu.getByText("Business management", { exact: true }).click();
    await menu.getByLabel("Business name", { exact: true }).fill(businessName);
    await menu
      .getByLabel("Business description", { exact: true })
      .fill("Isolated test business, removed after verification.");
    await menu
      .getByRole("button", { name: "Create business", exact: true })
      .click();
    await expect(
      menu.getByText("Approval pending", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const panel = page.locator(".events-panel");
    await panel
      .getByRole("button", { name: "+ Host Event", exact: true })
      .click();
    await expect(
      panel.getByText(
        "Publishing requires an approved business that you own. Manage your businesses from the profile menu.",
        { exact: true },
      ),
    ).toBeVisible();
    await panel
      .getByRole("button", { name: "Close form", exact: true })
      .click();
    const owner = (
      await db.pool.query(
        "SELECT user_id FROM identity_password_accounts WHERE email=$1",
        [emails[0]],
      )
    ).rows[0].user_id;
    const businessId = (
      await db.pool.query(
        "SELECT id FROM business_organizations WHERE owner_id=$1",
        [owner],
      )
    ).rows[0].id;
    const registered = await reviewContext.request.post(
      `${origin}/api/v1/identity/register`,
      {
        headers: { origin },
        data: { email: emails[1], password: "Real-reviewer-browser!97" },
      },
    );
    expect(registered.status()).toBe(201);
    const reviewer = (await registered.json()).account.id;
    // Test privilege only in guarded vq_test; approval itself passes through the real audited Business API.
    await db.pool.query(
      "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'business.review')",
      [reviewer],
    );
    const approval = await reviewContext.request.post(
      `${origin}/api/v1/businesses/${businessId}/review`,
      { headers: { origin }, data: { decision: "approved" } },
    );
    expect(approval.status()).toBe(200);
    await panel
      .getByRole("button", { name: "+ Host Event", exact: true })
      .click();
    const form = panel.locator(".event-form");
    await form
      .getByRole("combobox", { name: "Hosting business", exact: true })
      .selectOption(businessId);
    await form.getByLabel("Event title", { exact: true }).fill(title);
    await form
      .getByLabel("Description", { exact: true })
      .fill("A real official event fixture in isolated PostgreSQL.");
    await form
      .getByLabel("Location / area", { exact: true })
      .fill("Medina, Tunis");
    await form.getByLabel("Event images", { exact: true }).setInputFiles({
      name: "real-event.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await form
      .getByRole("button", { name: "Publish Event", exact: true })
      .click();
    const card = panel.locator(".event-card").filter({ hasText: title });
    await expect(card.locator(".event-summary strong")).toHaveText(title);
    await expect
      .poll(() =>
        card
          .locator(".event-summary img")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBe(1);
    expect(
      await panel.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(8, 16, 34)");
    const row = (
      await db.pool.query(
        "SELECT e.id,e.host_name,m.id AS media_id,m.visibility,m.owner_id FROM events_entries e JOIN events_attachments a ON a.event_id=e.id JOIN media_objects m ON m.id=a.media_id WHERE e.title=$1",
        [title],
      )
    ).rows[0];
    expect(row).toMatchObject({
      host_name: businessName,
      visibility: "public",
      owner_id: owner,
    });
    expect(
      (
        await page.request.delete(`/api/v1/media/${row.media_id}`, {
          headers: { origin },
        })
      ).status(),
    ).toBe(409);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
      "base64",
    );
    for (const [context, visibility] of [
      [page.context(), "private"],
      [reviewContext, "public"],
    ] as const) {
      const intent = await context.request.post(
        `${origin}/api/v1/media/uploads`,
        { headers: { origin }, data: { visibility } },
      );
      expect(intent.status()).toBe(201);
      const mediaId = (await intent.json()).media.id;
      expect(
        (
          await context.request.put(
            `${origin}/api/v1/media/uploads/${mediaId}`,
            { headers: { origin, "Content-Type": "image/png" }, data: png },
          )
        ).status(),
      ).toBe(200);
      expect(
        (
          await page.request.post("/api/v1/events", {
            headers: { origin },
            data: {
              businessId,
              title: "Rejected media fixture",
              description: "Must not persist",
              location: "Tunis",
              tag: "music",
              startsAt: null,
              mediaIds: [mediaId],
            },
          })
        ).status(),
      ).toBe(422);
    }
    expect(
      (
        await db.pool.query(
          "SELECT id FROM events_entries WHERE owner_id=$1 AND title='Rejected media fixture'",
          [owner],
        )
      ).rowCount,
    ).toBe(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await panel.screenshot({ path: ".local/reconstruction/events-dark.png" });
    await guest.goto(`${origin}/en/home`);
    const guestCard = guest.locator(".event-card").filter({ hasText: title });
    await expect(guestCard.locator(".event-summary strong")).toHaveText(title);
    await guestCard.locator(".event-summary").click();
    await expect(
      guestCard.getByText("Sign in to RSVP.", { exact: true }),
    ).toBeVisible();
    expect(
      await guestCard
        .getByRole("button", { name: "Edit Event", exact: true })
        .count(),
    ).toBe(0);
    await expect
      .poll(() =>
        guestCard
          .locator(".event-summary img")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBe(1);
    await card
      .getByRole("button", { name: "RSVP / Going", exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "Cancel RSVP", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await card.locator(".event-summary").click();
    await expect(
      card.getByRole("button", { name: "Cancel RSVP", exact: true }),
    ).toBeVisible();
    await card.getByRole("button", { name: "Save Event", exact: true }).click();
    await expect(
      card.getByRole("button", {
        name: "Saved — remove bookmark",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await card.locator(".event-summary").click();
    await expect(
      card.getByRole("button", {
        name: "Saved — remove bookmark",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await card.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(11, 27, 61)");
    await card.getByRole("button", { name: "Edit Event", exact: true }).click();
    await card
      .getByLabel("Description", { exact: true })
      .fill("Edited real official event");
    await card
      .getByRole("button", { name: "Remove image", exact: true })
      .click();
    await card
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      card.getByText("Edited real official event", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (
            await db.pool.query("SELECT id FROM media_objects WHERE id=$1", [
              row.media_id,
            ])
          ).rowCount,
        { timeout: 75000 },
      )
      .toBe(0);
    const profile = await reviewContext.request.put(
      `${origin}/api/v1/profile/me`,
      {
        headers: { origin },
        data: {
          name: "Actual Chrome Reviewer",
          bio: "Isolated fixture",
          handle: null,
          favoriteVibe: "Cozy",
          version: 0,
        },
      },
    );
    expect(profile.status()).toBe(200);
    const reviewerPage = await reviewContext.newPage();
    await reviewerPage.goto(`${origin}/en/home`);
    const reviewerCard = reviewerPage
      .locator(".event-card")
      .filter({ hasText: title });
    await reviewerCard.locator(".event-summary").click();
    await reviewerCard
      .getByRole("textbox", { name: "Review notes", exact: true })
      .fill("Review through real Chrome and PostgreSQL");
    await reviewerCard
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(
      reviewerCard.getByText("Review through real Chrome and PostgreSQL", {
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await card.locator(".event-summary").click();
    await expect(
      card.getByText("Review through real Chrome and PostgreSQL", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    await page.getByText("Appearance", { exact: true }).click();
    await page
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption("light");
    await page.keyboard.press("Escape");
    expect(
      await panel.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(238, 244, 255)");
    await panel.screenshot({ path: ".local/reconstruction/events-light.png" });
    await card
      .getByRole("button", { name: "Cancel Event", exact: true })
      .click();
    await card
      .getByRole("button", { name: "Confirm cancellation", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    expect(
      (
        await db.pool.query(
          "SELECT cancelled_at IS NOT NULL AS cancelled FROM events_entries WHERE id=$1",
          [row.id],
        )
      ).rows[0].cancelled,
    ).toBe(true);
  } finally {
    const users = (
      await db.pool.query(
        "SELECT user_id FROM identity_password_accounts WHERE email=ANY($1::text[])",
        [emails],
      )
    ).rows.map((row) => row.user_id);
    await db.pool.query(
      "DELETE FROM events_entries WHERE owner_id=ANY($1::uuid[])",
      [users],
    );
    const media = createMedia(
      db.media,
      createLocalMediaStorage(path.resolve(".local/events-browser-media")),
      imageProcessor,
    );
    for (const row of (
      await db.pool.query(
        "SELECT id,owner_id FROM media_objects WHERE owner_id=ANY($1::uuid[])",
        [users],
      )
    ).rows)
      await media.remove(row.owner_id, row.id);
    await db.pool.query(
      "DELETE FROM business_organizations WHERE owner_id=ANY($1::uuid[])",
      [users],
    );
    await db.pool.query(
      "DELETE FROM events_media_retirements WHERE user_id=ANY($1::uuid[])",
      [users],
    );
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users,
    ]);
    await guestContext.close();
    await reviewContext.close();
    await db.close();
  }
});
