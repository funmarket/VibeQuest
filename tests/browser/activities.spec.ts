import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { createDatabase } from "../../packages/database/src/index";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
import path from "node:path";
test("real Activities publishing, public images, scheduling, reviews, edit and cancel", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  const db = createDatabase(
    "postgresql://vq_local@127.0.0.1:55439/vq_foundation",
  );
  const email = `activities-chrome-${randomUUID()}@example.test`;
  const title = `Chrome activity fixture ${randomUUID().slice(0, 8)}`;
  const upcoming = `Scheduled ${title}`;
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
    await menu.getByLabel("Email", { exact: true }).fill(email);
    await menu
      .getByLabel("Password", { exact: true })
      .fill("Real-activity-browser!87");
    await menu.getByRole("button", { name: "Register", exact: true }).click();
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    const panel = page.locator(".activities-panel");
    await panel
      .getByRole("button", { name: "+ Post Activity", exact: true })
      .click();
    await expect(
      panel.getByText(
        "Complete your display name and biography before posting or scheduling an activity.",
        { exact: true },
      ),
    ).toBeVisible();
    await panel.getByText("Edit profile", { exact: true }).click();
    await panel
      .getByLabel("Name", { exact: true })
      .fill("Chrome Activities Reporter");
    await panel
      .getByLabel("Biography", { exact: true })
      .fill("Real profile for an explicitly removed browser fixture.");
    await panel
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(
      panel.getByText("Profile complete", { exact: true }),
    ).toBeVisible();
    await panel
      .getByRole("button", { name: "Check profile completion", exact: true })
      .click();
    const form = panel.locator(".activity-form");
    await form.getByLabel("Activity title", { exact: true }).fill(title);
    await form
      .getByLabel("Description", { exact: true })
      .fill("A genuine PostgreSQL fixture, not production activity.");
    await form
      .getByLabel("Location / area", { exact: true })
      .fill("Medina, Tunis");
    await form.getByLabel("Activity images", { exact: true }).setInputFiles({
      name: "not-an-image.png",
      mimeType: "image/png",
      buffer: Buffer.from("this is not a real PNG"),
    });
    await form
      .getByRole("button", { name: "Share Live Activity", exact: true })
      .click();
    await expect(form.getByRole("alert")).toBeVisible();
    expect(
      (
        await db.pool.query(
          "SELECT id FROM activities_entries WHERE title=$1",
          [title],
        )
      ).rowCount,
    ).toBe(0);
    await form.getByLabel("Activity images", { exact: true }).setInputFiles({
      name: "real-fixture.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await form
      .getByRole("button", { name: "Share Live Activity", exact: true })
      .click();
    const card = panel.locator(".activity-card").filter({ hasText: title });
    await expect(card.locator(".activity-summary strong")).toHaveText(title);
    const persisted = (
      await db.pool.query(
        "SELECT a.id,a.author,a.owner_id,m.owner_id AS media_owner,m.visibility,m.status FROM activities_entries a JOIN activities_attachments at ON at.activity_id=a.id JOIN media_objects m ON m.id=at.media_id WHERE a.title=$1",
        [title],
      )
    ).rows;
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      author: "Chrome Activities Reporter",
      visibility: "public",
      status: "ready",
    });
    expect(persisted[0].owner_id).toBe(persisted[0].media_owner);
    await expect
      .poll(() =>
        card
          .locator(".activity-summary img")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBe(1);
    const colors = await panel.evaluate((element) => ({
      bg: getComputedStyle(element).backgroundColor,
      border: getComputedStyle(element).borderTopColor,
    }));
    expect(colors).toEqual({ bg: "rgb(3, 29, 16)", border: "rgb(13, 83, 48)" });
    expect(
      await card.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(4, 51, 26)");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await panel.screenshot({
      path: ".local/reconstruction/activities-dark.png",
    });
    await guest.goto("http://127.0.0.1:3000/en/home");
    const guestCard = guest
      .locator(".activity-card")
      .filter({ hasText: title });
    await expect(guestCard.locator(".activity-summary strong")).toHaveText(
      title,
    );
    await expect
      .poll(() =>
        guestCard
          .locator(".activity-summary img")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBe(1);
    await guestCard.locator(".activity-summary").click();
    await expect(
      guestCard.getByText("Sign in to save this activity.", { exact: true }),
    ).toBeVisible();
    expect(
      await guestCard
        .getByRole("button", { name: "Edit Activity", exact: true })
        .count(),
    ).toBe(0);
    await card
      .getByRole("button", { name: "Save Activity", exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "Unsave Activity", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    const reloaded = page.locator(".activity-card").filter({ hasText: title });
    await reloaded.locator(".activity-summary").click();
    await expect(
      reloaded.getByRole("button", { name: "Unsave Activity", exact: true }),
    ).toBeVisible();
    await reloaded
      .getByRole("button", { name: "Edit Activity", exact: true })
      .click();
    await expect(
      reloaded.getByRole("textbox", { name: "Description", exact: true }),
    ).toBeVisible();
    await reloaded
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Edited through the real Web UI");
    await reloaded
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      reloaded.getByText("Edited through the real Web UI", { exact: true }),
    ).toBeVisible();
    await page
      .locator(".activities-panel")
      .getByRole("tab", { name: "Upcoming Activities", exact: true })
      .click();
    await page
      .locator(".activities-panel")
      .getByRole("button", { name: "Schedule Activity", exact: true })
      .click();
    const schedule = page.locator(".activity-form");
    await schedule.getByLabel("Activity title", { exact: true }).fill(upcoming);
    await schedule
      .getByLabel("Description", { exact: true })
      .fill("Scheduled persisted fixture");
    await schedule.getByLabel("Location / area", { exact: true }).fill("Tunis");
    const date = new Date(Date.now() + 3600000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    await schedule
      .getByLabel("Meeting date and time", { exact: true })
      .fill(local);
    await schedule
      .getByRole("button", { name: "Schedule Activity", exact: true })
      .click();
    const scheduledCard = page
      .locator(".activity-card")
      .filter({ hasText: upcoming });
    await expect(scheduledCard.locator(".activity-summary strong")).toHaveText(
      upcoming,
    );
    await scheduledCard
      .getByLabel("Review notes", { exact: true })
      .fill("Review saved through actual Chrome");
    await scheduledCard
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(
      scheduledCard.getByText("Review saved through actual Chrome", {
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("tab", { name: "Upcoming Activities", exact: true })
      .click();
    await scheduledCard.locator(".activity-summary").click();
    await expect(
      scheduledCard.getByText("Review saved through actual Chrome", {
        exact: true,
      }),
    ).toBeVisible();
    await scheduledCard
      .getByRole("button", { name: "Cancel Activity", exact: true })
      .click();
    await scheduledCard
      .getByRole("button", { name: "Confirm cancellation", exact: true })
      .click();
    await expect(scheduledCard).toHaveCount(0);
    expect(
      (
        await db.pool.query(
          "SELECT cancelled_at IS NOT NULL AS cancelled FROM activities_entries WHERE title=$1",
          [upcoming],
        )
      ).rows[0].cancelled,
    ).toBe(true);
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
    ).toBe("rgb(237, 250, 242)");
    await panel
      .getByRole("tab", { name: "Live Activities", exact: true })
      .click();
    await expect(card.locator(".activity-summary strong")).toHaveText(title);
    expect(
      await card.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(221, 244, 230)");
    await panel.screenshot({
      path: ".local/reconstruction/activities-light.png",
    });
  } finally {
    const users = (
      await db.pool.query(
        "SELECT user_id FROM identity_password_accounts WHERE email=$1",
        [email],
      )
    ).rows.map((row) => row.user_id);
    await db.pool.query(
      "DELETE FROM activities_entries WHERE owner_id=ANY($1::uuid[])",
      [users],
    );
    const media = createMedia(
      db.media,
      createLocalMediaStorage(path.resolve(".local/media")),
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
      "DELETE FROM activities_media_retirements WHERE user_id=ANY($1::uuid[])",
      [users],
    );
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users,
    ]);
    await guestContext.close();
    await db.close();
  }
});
