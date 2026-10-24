import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { setTheme } from "./profile-controls";
import { browserDatabase } from "./browser-database";
import en from "../../apps/web/src/i18n/locales/en.json" with { type: "json" };
import fr from "../../apps/web/src/i18n/locales/fr.json" with { type: "json" };
import es from "../../apps/web/src/i18n/locales/es.json" with { type: "json" };
import ar from "../../apps/web/src/i18n/locales/ar.json" with { type: "json" };
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
import path from "node:path";
test("real Activities publishing, public images, scheduling, reviews, edit and cancel", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(15000);
  const db = browserDatabase();
  const email = `activities-chrome-${randomUUID()}@example.test`;
  const title = `Chrome activity fixture ${randomUUID().slice(0, 8)}`;
  const upcoming = `Scheduled ${title}`;
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  try {
    await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "/* Host protocol fixture is installed by addInitScript. */",
      }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      Object.assign(window, {
        activityHaptics: 0,
        Telegram: {
          WebApp: {
            initData: "host-protocol-fixture-only",
            HapticFeedback: {
              impactOccurred: () => {
                (window as unknown as Window & { activityHaptics: number })
                  .activityHaptics++;
              },
            },
          },
        },
      });
    });
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
    await expect(page.locator(".profile-menu")).toBeHidden();
    const panel = page.locator(".activities-panel");
    const beforePostHaptic = await page.evaluate(
      () =>
        (window as unknown as Window & { activityHaptics: number })
          .activityHaptics,
    );
    await panel
      .getByRole("button", { name: "+ Post Activity", exact: true })
      .click();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as Window & { activityHaptics: number })
            .activityHaptics,
      ),
    ).toBe(beforePostHaptic + 1);
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
    await panel.getByText("Edit profile", { exact: true }).click();
    await expect(
      panel.getByRole("textbox", { name: "Biography", exact: true }),
    ).toBeVisible();
    await panel.getByText("Edit profile", { exact: true }).click();
    await expect(
      form.getByLabel("Activity title", { exact: true }),
    ).toHaveValue(title);
    await form
      .getByRole("combobox", { name: "Activity indicator", exact: true })
      .selectOption("🎨");
    const png = {
      name: "limit.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    };
    await form
      .getByLabel("Description", { exact: true })
      .fill("A genuine PostgreSQL fixture, not production activity.");
    await form
      .getByLabel("Location / area", { exact: true })
      .fill("Medina, Tunis");
    await form.getByLabel("Activity title", { exact: true }).fill("   ");
    await form
      .getByRole("button", { name: "Share Live Activity", exact: true })
      .click();
    await expect(form.getByRole("alert")).toBeVisible();
    await form.getByLabel("Activity title", { exact: true }).fill(title);
    await form
      .getByLabel("Activity images", { exact: true })
      .setInputFiles([png, png, png, png, png]);
    await form
      .getByRole("button", { name: "Share Live Activity", exact: true })
      .click();
    await expect(form.getByRole("alert")).toHaveText(
      "Choose at most four images.",
    );
    await page.route("**/api/v1/activities", async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({
          status: 503,
          json: { code: "ACTIVITIES_UNAVAILABLE" },
        });
      else await route.continue();
    });
    await form.getByLabel("Activity images", { exact: true }).setInputFiles([]);
    await form
      .getByRole("button", { name: "Share Live Activity", exact: true })
      .click();
    await expect(form.getByRole("alert")).toHaveText(en.activities.failed);
    await expect(
      form.getByLabel("Activity title", { exact: true }),
    ).toHaveValue(title);
    expect(
      (
        await db.pool.query(
          "SELECT id FROM activities_entries WHERE title=$1",
          [title],
        )
      ).rowCount,
    ).toBe(0);
    await page.unroute("**/api/v1/activities");
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
    await form
      .getByLabel("Activity images", { exact: true })
      .setInputFiles([png, png, png, png]);
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
    expect(persisted).toHaveLength(4);
    expect(
      persisted.every(
        (row) =>
          row.owner_id === row.media_owner &&
          row.visibility === "public" &&
          row.status === "ready",
      ),
    ).toBe(true);
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
    await expect(card.getByText("Art / crafts", { exact: true })).toBeVisible();
    await card
      .getByRole("button", { name: "Save Activity", exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "Unsave Activity", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await card
      .getByRole("button", { name: "Unsave Activity", exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "Save Activity", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await card
      .getByRole("button", { name: "Save Activity", exact: true })
      .click();
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
    await reloaded
      .getByRole("button", { name: "Edit Activity", exact: true })
      .click();
    const current = await (
      await page.request.get("/api/v1/activities/" + persisted[0].id)
    ).json();
    const {
      title: ct,
      location,
      emoji,
      startsAt,
      mediaIds,
      version,
    } = current.activity;
    const concurrent = await page.request.put(
      "/api/v1/activities/" + persisted[0].id,
      {
        headers: { Origin: "http://127.0.0.1:3000" },
        data: {
          title: ct,
          description: "Concurrent persisted edit",
          location,
          emoji,
          startsAt,
          mediaIds,
          version,
        },
      },
    );
    expect(concurrent.ok()).toBe(true);
    await reloaded
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(reloaded.getByRole("alert")).toHaveText(
      en.activities.conflict,
    );
    await reloaded
      .getByRole("button", { name: "Reload activity", exact: true })
      .click();
    await expect(
      reloaded.getByText("Concurrent persisted edit", { exact: true }),
    ).toBeVisible();
    await reloaded
      .getByRole("button", { name: "Cancel Activity", exact: true })
      .click();
    await reloaded.locator(".activity-summary").click();
    await reloaded.locator(".activity-summary").click();
    await expect(
      reloaded.getByRole("button", {
        name: "Confirm cancellation",
        exact: true,
      }),
    ).toBeHidden();
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
    await expect(
      scheduledCard.getByLabel("Review notes", { exact: true }),
    ).toBeHidden();
    await scheduledCard
      .getByRole("button", { name: "Evaluate assembly", exact: true })
      .click();
    await scheduledCard
      .getByRole("radio", { name: "3 / 5", exact: true })
      .check();
    await scheduledCard
      .getByRole("radio", { name: "3 / 5", exact: true })
      .focus();
    await page.keyboard.press("ArrowLeft");
    await expect(
      scheduledCard.getByRole("radio", { name: "2 / 5", exact: true }),
    ).toBeChecked();
    await page.keyboard.press("ArrowRight");
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
    await expect(
      scheduledCard.getByText("3.0 / 5 · 1", { exact: false }),
    ).toBeVisible();
    await expect(
      scheduledCard.getByLabel("Review notes", { exact: true }),
    ).toBeHidden();
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
      .getByRole("button", { name: "Keep Activity", exact: true })
      .click();
    await expect(
      scheduledCard.getByRole("button", {
        name: "Confirm cancellation",
        exact: true,
      }),
    ).toBeHidden();
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
    expect(
      await page.evaluate(
        () =>
          (window as unknown as Window & { activityHaptics: number })
            .activityHaptics,
      ),
    ).toBeGreaterThan(0);
    await guestContext.route("https://www.google.com/maps/**", (route) =>
      route.fulfill({ body: "Map destination fixture" }),
    );
    for (const [locale, messages] of Object.entries({ en, fr, es, ar })) {
      await page.goto("/" + locale + "/home");
      await page.setViewportSize({ width: 320, height: 844 });
      await panel
        .getByRole("button", { name: messages.activities.post, exact: true })
        .click();
      const localizedForm = panel.locator(".activity-form");
      const indicator = localizedForm.getByRole("combobox", {
        name: messages.activities.indicator,
        exact: true,
      });
      await indicator.selectOption("🎻");
      await expect(indicator).toHaveValue("🎻");
      await expect(indicator.locator("option:checked")).toHaveText(
        "🎻 " + messages.activities.category7,
      );
      await localizedForm
        .getByRole("textbox", { name: messages.activities.title, exact: true })
        .fill("Unsubmitted locale fixture");
      await panel
        .getByText(messages.identity.editProfile, { exact: true })
        .press("Enter");
      await expect(
        panel.getByRole("textbox", {
          name: messages.identity.biography,
          exact: true,
        }),
      ).toBeVisible();
      await panel
        .getByText(messages.identity.editProfile, { exact: true })
        .press("Enter");
      await expect(
        localizedForm.getByRole("textbox", {
          name: messages.activities.title,
          exact: true,
        }),
      ).toHaveValue("Unsubmitted locale fixture");
      await localizedForm.screenshot({
        path: ".local/r04/" + locale + "-form-320.png",
      });
      await panel
        .getByRole("tab", { name: messages.activities.upcoming, exact: true })
        .click();
      await panel
        .getByRole("button", {
          name: messages.activities.schedule,
          exact: true,
        })
        .click();
      await expect(
        localizedForm.locator("input[name=startsAt]"),
      ).toHaveAttribute("type", "datetime-local");
      await localizedForm
        .getByRole("button", { name: messages.activities.close, exact: true })
        .click();
      await guest.setViewportSize({ width: 320, height: 844 });
      await guest.goto("http://127.0.0.1:3000/" + locale + "/home");
      const localizedCard = guest
        .locator(".activity-card")
        .filter({ hasText: title });
      await localizedCard.locator(".activity-summary").click();
      await expect(
        localizedCard.getByText(messages.activities.category2, { exact: true }),
      ).toBeVisible();
      expect(
        await guest.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      if (locale === "ar")
        await expect(guest.locator("html")).toHaveAttribute("dir", "rtl");
      for (const theme of ["light", "dark", "system"]) {
        await setTheme(guest, theme);
        for (const width of [320, 1280]) {
          await guest.setViewportSize({ width, height: 844 });
          expect(
            await guest.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
          ).toBe(false);
          await localizedCard.screenshot({
            path: ".local/r04/" + locale + "-" + theme + "-" + width + ".png",
          });
        }
      }
      const link = localizedCard.getByRole("link", {
        name: messages.activities.directions,
        exact: true,
      });
      await expect(link).toHaveAttribute(
        "href",
        "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(title + " Medina, Tunis"),
      );
      const request = guest.waitForRequest(
        (req) =>
          new URL(req.url()).pathname === "/api/v1/places" &&
          new URL(req.url()).searchParams.get("q") === "Medina, Tunis",
      );
      const popup = guest.waitForEvent("popup");
      await link.click();
      await expect(guest).toHaveURL(
        "http://127.0.0.1:3000/" + locale + "/explore?q=Medina%2C+Tunis",
      );
      await expect(
        guest.getByRole("textbox", {
          name: messages.explore.search,
          exact: true,
        }),
      ).toHaveValue("Medina, Tunis");
      await request;
      await (await popup).close();
      await guest.reload();
      await expect(
        guest.getByRole("textbox", {
          name: messages.explore.search,
          exact: true,
        }),
      ).toHaveValue("Medina, Tunis");
    }
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
      createLocalMediaStorage(
        path.resolve(process.env.MEDIA_LOCAL_ROOT ?? ".local/media"),
      ),
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
