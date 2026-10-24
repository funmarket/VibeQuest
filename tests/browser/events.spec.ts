import { randomUUID } from "node:crypto";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { browserDatabase } from "./browser-database";
import { setTheme } from "./profile-controls";
import en from "../../apps/web/src/i18n/locales/en.json" with { type: "json" };
import fr from "../../apps/web/src/i18n/locales/fr.json" with { type: "json" };
import es from "../../apps/web/src/i18n/locales/es.json" with { type: "json" };
import ar from "../../apps/web/src/i18n/locales/ar.json" with { type: "json" };
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
test("real approved-business hosting, images, public discovery, RSVP, reviews and cancellation", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(240000);
  page.setDefaultTimeout(15000);
  const db = browserDatabase();
  const localOrigin = new URL(baseURL ?? "invalid:");
  if (
    localOrigin.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(localOrigin.hostname)
  )
    throw new Error(
      "Events browser writes require an isolated loopback origin.",
    );
  const origin = localOrigin.origin;
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
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
      route.fulfill({ body: "", contentType: "application/javascript" }),
    );
    await page.addInitScript(() => {
      Object.assign(window, {
        eventHaptics: 0,
        Telegram: {
          WebApp: {
            initData: "host-protocol-fixture-only",
            HapticFeedback: {
              impactOccurred: () => {
                (window as unknown as Window & { eventHaptics: number })
                  .eventHaptics++;
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
    await expect(page.locator(".profile-menu")).toBeHidden();
    const panel = page.locator(".events-panel");
    const beforeHost = await page.evaluate(
      () =>
        (window as unknown as Window & { eventHaptics: number }).eventHaptics,
    );
    await panel
      .getByRole("button", { name: "+ Host Event", exact: true })
      .click();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as Window & { eventHaptics: number }).eventHaptics,
      ),
    ).toBeGreaterThan(beforeHost);
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
    await form
      .getByRole("combobox", { name: "Category", exact: true })
      .selectOption("music");
    await form.getByLabel("Event title", { exact: true }).fill("   ");
    await form
      .getByRole("button", { name: "Publish Event", exact: true })
      .click();
    await expect(form.getByRole("alert")).toHaveText(
      "Enter an event title and location. Check the field lengths.",
    );
    await form.getByLabel("Event title", { exact: true }).fill(title);
    const upload = {
      name: "event.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    };
    await form
      .getByLabel("Event images", { exact: true })
      .setInputFiles([upload, upload, upload, upload, upload]);
    await form
      .getByRole("button", { name: "Publish Event", exact: true })
      .click();
    await expect(form.getByRole("alert")).toHaveText(
      en.officialEvents.mediaLimit,
    );
    await form.getByLabel("Event images", { exact: true }).setInputFiles([]);
    await page.route("**/api/v1/events", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 503, json: { code: "EVENTS_UNAVAILABLE" } })
        : route.continue(),
    );
    await form
      .getByRole("button", { name: "Publish Event", exact: true })
      .click();
    await expect(form.getByRole("alert")).toHaveText(en.officialEvents.failed);
    await expect(form.getByLabel("Event title", { exact: true })).toHaveValue(
      title,
    );
    expect(
      (
        await db.pool.query("SELECT id FROM events_entries WHERE title=$1", [
          title,
        ])
      ).rowCount,
    ).toBe(0);
    await page.unroute("**/api/v1/events");
    await form
      .getByLabel("Event images", { exact: true })
      .setInputFiles([upload, upload, upload, upload]);
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
    expect(
      (
        await db.pool.query(
          "SELECT media_id FROM events_attachments WHERE event_id=$1",
          [row.id],
        )
      ).rowCount,
    ).toBe(4);
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
    await expect(card.locator(".event-going")).toHaveText(
      en.officialEvents.goingCount,
    );
    await card
      .getByRole("button", { name: "Cancel RSVP", exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "RSVP / Going", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await card
      .getByRole("button", { name: "RSVP / Going", exact: true })
      .click();
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
    await card
      .getByRole("button", { name: en.officialEvents.saved, exact: true })
      .click();
    await expect(
      card.getByRole("button", { name: "Save Event", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await card.getByRole("button", { name: "Save Event", exact: true }).click();
    await card.getByRole("button", { name: "Edit Event", exact: true }).click();
    await card
      .getByLabel("Description", { exact: true })
      .fill("Edited real official event");
    while (
      await card
        .getByRole("button", { name: "Remove image", exact: true })
        .count()
    )
      await card
        .getByRole("button", { name: "Remove image", exact: true })
        .first()
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
    await card.getByRole("button", { name: "Edit Event", exact: true }).click();
    const current = (
      await (await page.request.get("/api/v1/events/" + row.id)).json()
    ).event;
    const {
      businessId: bid,
      title: ct,
      location,
      tag,
      startsAt,
      mediaIds,
      version,
    } = current;
    const concurrent = await page.request.put("/api/v1/events/" + row.id, {
      headers: { origin },
      data: {
        businessId: bid,
        title: ct,
        description: "Concurrent Event edit",
        location,
        tag,
        startsAt,
        mediaIds,
        version,
      },
    });
    expect(concurrent.status()).toBe(200);
    await card
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(card.getByRole("alert")).toHaveText(
      en.officialEvents.conflict,
    );
    await card
      .getByRole("button", { name: "Reload event", exact: true })
      .click();
    await expect(
      card.getByText("Concurrent Event edit", { exact: true }),
    ).toBeVisible();
    expect(
      (
        await reviewContext.request.put(origin + "/api/v1/events/" + row.id, {
          headers: { origin },
          data: {
            businessId: bid,
            title: ct,
            description: "Forbidden",
            location,
            tag,
            startsAt,
            mediaIds,
            version,
          },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await reviewContext.request.post(
          origin + "/api/v1/events/" + row.id + "/cancel",
          { headers: { origin }, data: { version: version + 1 } },
        )
      ).status(),
    ).toBe(403);
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
    await expect(
      reviewerCard.getByRole("textbox", { name: "Review notes", exact: true }),
    ).toBeHidden();
    await reviewerCard
      .getByRole("button", { name: "Evaluate Event", exact: true })
      .click();
    await reviewerCard
      .getByRole("radio", { name: "4 / 5", exact: true })
      .check();
    await reviewerCard
      .getByRole("radio", { name: "4 / 5", exact: true })
      .focus();
    await reviewerPage.keyboard.press("ArrowLeft");
    await expect(
      reviewerCard.getByRole("radio", { name: "3 / 5", exact: true }),
    ).toBeChecked();
    await reviewerPage.keyboard.press("ArrowRight");
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
    await expect(page.locator(".profile-menu")).toBeHidden();
    expect(
      await panel.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgb(238, 244, 255)");
    await panel.screenshot({ path: ".local/reconstruction/events-light.png" });
    expect(
      await page.evaluate(
        () =>
          (window as unknown as Window & { eventHaptics: number }).eventHaptics,
      ),
    ).toBeGreaterThan(0);
    await guestContext.route("https://www.google.com/maps/**", (route) =>
      route.fulfill({ body: "Map destination fixture" }),
    );
    await panel
      .getByRole("tab", { name: en.officialEvents.upcoming, exact: true })
      .click();
    await panel
      .getByRole("button", { name: en.officialEvents.host, exact: true })
      .click();
    const schedule = panel.locator(".event-form");
    await schedule
      .getByRole("textbox", { name: en.officialEvents.title, exact: true })
      .fill(title + " scheduled");
    await schedule
      .getByRole("textbox", { name: en.officialEvents.location, exact: true })
      .fill("Tunis");
    const future = new Date(Date.now() + 3600000);
    const local = new Date(
      future.getTime() - future.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    await schedule.locator("input[name=startsAt]").fill("2020-01-01T12:00");
    await schedule
      .getByRole("button", { name: en.officialEvents.publish, exact: true })
      .click();
    await expect(schedule.getByRole("alert")).toHaveText(
      en.officialEvents.invalidSchedule,
    );
    await schedule.locator("input[name=startsAt]").fill(local);
    await schedule
      .getByRole("button", { name: en.officialEvents.publish, exact: true })
      .click();
    const scheduled = panel
      .locator(".event-card")
      .filter({ hasText: title + " scheduled" });
    await expect(scheduled.locator("time")).toBeVisible();
    await scheduled
      .getByRole("button", { name: en.officialEvents.cancelEvent, exact: true })
      .click();
    await scheduled
      .getByRole("button", {
        name: en.officialEvents.confirmCancel,
        exact: true,
      })
      .click();
    await expect(scheduled).toHaveCount(0);
    await panel.locator("#events-tab-live").click();
    await card.locator(".event-summary").click();
    const cases = {
      en: {
        messages: en,
        tag: "music",
        filter: "venue",
        label: en.explore.venues,
      },
      fr: { messages: fr, tag: "art", filter: "art", label: fr.explore.art },
      es: { messages: es, tag: "cafe", filter: null, label: es.explore.all },
      ar: { messages: ar, tag: "theatre", filter: null, label: ar.explore.all },
    };
    for (const [
      locale,
      { messages, tag: eventTag, filter, label },
    ] of Object.entries(cases)) {
      await page.goto(origin + "/" + locale + "/home");
      await card.locator(".event-summary").click();
      await card
        .getByRole("button", {
          name: messages.officialEvents.edit,
          exact: true,
        })
        .click();
      await card
        .getByRole("combobox", {
          name: messages.officialEvents.category,
          exact: true,
        })
        .selectOption(eventTag);
      await expect(
        card.getByRole("combobox", {
          name: messages.officialEvents.category,
          exact: true,
        }),
      ).toHaveValue(eventTag);
      await card
        .locator(".event-form")
        .screenshot({ path: ".local/r05/" + locale + "-edit-form.png" });
      await card
        .getByRole("button", {
          name: messages.officialEvents.saveChanges,
          exact: true,
        })
        .click();
      await guest.goto(origin + "/" + locale + "/home");
      const localized = guest.locator(".event-card").filter({ hasText: title });
      await localized.locator(".event-summary").click();
      for (const theme of ["light", "dark", "system"]) {
        await setTheme(guest, theme);
        for (const width of [320, 1280]) {
          await guest.setViewportSize({ width, height: 844 });
          expect(
            await guest.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
          ).toBe(false);
          await localized.screenshot({
            path: ".local/r05/" + locale + "-" + theme + "-" + width + ".png",
          });
        }
      }
      if (locale === "ar")
        await expect(guest.locator("html")).toHaveAttribute("dir", "rtl");
      const nav = localized.getByRole("link", {
        name: messages.officialEvents.directions,
        exact: true,
      });
      await expect(nav).toHaveAttribute(
        "href",
        "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(title + " Medina, Tunis"),
      );
      const places = guest.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/v1/places" &&
          new URL(r.url()).searchParams.get("q") === title &&
          new URL(r.url()).searchParams.get("category") === filter,
      );
      const popup = guest.waitForEvent("popup");
      await nav.click();
      await expect(guest).toHaveURL(
        origin +
          "/" +
          locale +
          "/explore?" +
          new URLSearchParams({ q: title, category: eventTag }),
      );
      expect((await places).ok()).toBe(true);
      await expect(
        guest.getByRole("textbox", {
          name: messages.explore.search,
          exact: true,
        }),
      ).toHaveValue(title);
      await expect(
        guest.getByRole("button", {
          name: label,
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "true");
      await (await popup).close();
      await guest.reload();
      await expect(
        guest.getByRole("textbox", {
          name: messages.explore.search,
          exact: true,
        }),
      ).toHaveValue(title);
      await guest.goto(origin + "/" + locale + "/explore?q=Medina");
      await expect(
        guest.getByRole("button", { name: messages.explore.all, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        guest.getByRole("textbox", {
          name: messages.explore.search,
          exact: true,
        }),
      ).toHaveValue("Medina");
    }
    await page.goto(origin + "/en/home");
    await card.locator(".event-summary").click();
    await card
      .getByRole("button", { name: en.officialEvents.cancelEvent, exact: true })
      .click();
    await card
      .getByRole("button", { name: en.officialEvents.keep, exact: true })
      .click();
    await expect(
      card.getByRole("button", {
        name: en.officialEvents.confirmCancel,
        exact: true,
      }),
    ).toBeHidden();
    await card
      .getByRole("button", { name: en.officialEvents.cancelEvent, exact: true })
      .click();
    await card.locator(".event-summary").click();
    await card.locator(".event-summary").click();
    await expect(
      card.getByRole("button", {
        name: en.officialEvents.confirmCancel,
        exact: true,
      }),
    ).toBeHidden();
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
