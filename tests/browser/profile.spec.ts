import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { browserDatabase } from "./browser-database";
import en from "../../apps/web/src/i18n/locales/en.json" with { type: "json" };
import fr from "../../apps/web/src/i18n/locales/fr.json" with { type: "json" };
import es from "../../apps/web/src/i18n/locales/es.json" with { type: "json" };
import ar from "../../apps/web/src/i18n/locales/ar.json" with { type: "json" };

test("R06 private profile journey, exact debounce, conflicts, cancel and localized layout", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(10000);
  const db = browserDatabase();
  let userId = "";
  const presets = [
    "cyberpunk",
    "web3",
    "solana",
    "neon",
    "tokyo",
    "tunis",
    "coffee-seeker",
    "retro-gaming",
    "cultural-pass",
    "minimalist",
  ];
  try {
    await page.goto("/en/home");
    const registration = await page.request.post("/api/v1/identity/register", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        email: `r06-browser-${randomUUID()}@example.test`,
        password: "R06-browser-password!79",
      },
    });
    expect(registration.status()).toBe(201);
    userId = (await registration.json()).account.id;
    await page.reload();
    await page.locator(".account").click();
    const menu = page.locator(".profile-menu");
    const profile = menu.locator(".self-profile");
    await expect(
      profile.getByRole("heading", { name: "Your profile" }),
    ).toBeVisible();
    await profile.getByText("Edit profile", { exact: true }).click();
    await profile
      .getByLabel("Name", { exact: true })
      .fill("R06 Browser Voyager");
    await profile
      .getByLabel("Biography", { exact: true })
      .fill("Real persisted profile.");
    for (const preset of presets) {
      const button = profile.getByRole("button", {
        name: `#${preset}`,
        exact: true,
      });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    await profile
      .getByRole("button", { name: "#neon", exact: true })
      .press("Enter");
    await expect(
      profile.getByRole("button", { name: "#neon", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await profile
      .getByLabel("Custom interest", { exact: true })
      .fill("Coffee Friends");
    await profile.getByLabel("Custom interest", { exact: true }).press("Enter");
    await profile
      .getByLabel("Custom interest", { exact: true })
      .fill("COFFEE FRIENDS");
    await profile
      .getByRole("button", { name: "Add interest", exact: true })
      .click();
    await expect(
      profile.getByRole("button", {
        name: "Remove interest coffee-friends",
        exact: true,
      }),
    ).toHaveCount(1);
    await profile
      .getByLabel("Location", { exact: true })
      .fill("Private R06 town");
    await profile
      .getByLabel("Contact protocol", { exact: true })
      .selectOption("email");
    await profile
      .getByLabel("Contact email", { exact: true })
      .fill("private-contact@example.test");
    await profile
      .getByLabel("Phone / WhatsApp", { exact: true })
      .fill("+216 123 456");
    await profile
      .getByLabel("X / Twitter handle", { exact: true })
      .fill("@traveler");
    await profile
      .getByLabel("Telegram handle", { exact: true })
      .fill("@voyager");
    await profile.getByLabel("Cozy Diary", { exact: true }).check();
    // Freeze browser time to prove the actual 450ms debounce boundary.
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    const handle = `browser_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
    let checks = 0;
    page.on("request", (request) => {
      if (request.url().includes("/v1/profile/handle?")) checks++;
    });
    await profile.getByLabel("Handle", { exact: true }).fill(handle);
    await expect(
      profile.getByText(en.identity.handleStatus_idle, { exact: true }),
    ).toBeVisible();
    await page.clock.runFor(449);
    expect(checks).toBe(0);
    await page.clock.runFor(1);
    await expect(
      profile.getByText(en.identity.handleStatus_available, { exact: true }),
    ).toBeVisible();
    expect(checks).toBe(1);
    await page.clock.resume();
    // Rapid typing cancels the earlier timer; late network results cannot replace the current handle.
    let releaseOld: (() => void) | undefined;
    let oldStarted = false;
    await page.route("**/v1/profile/handle?*", async (route) => {
      if (
        new URL(route.request().url()).searchParams.get("handle") ===
        "older_handle"
      ) {
        oldStarted = true;
        await new Promise<void>((resolve) => {
          releaseOld = resolve;
        });
        await route.fulfill({ json: { available: false } }).catch(() => {});
      } else await route.continue();
    });
    await profile.getByLabel("Handle", { exact: true }).fill("older_handle");
    await expect.poll(() => oldStarted).toBe(true);
    await profile.getByLabel("Handle", { exact: true }).fill("newer_handle");
    await expect(
      profile.getByText(en.identity.handleStatus_available, { exact: true }),
    ).toBeVisible();
    releaseOld?.();
    await expect(
      profile.getByText(en.identity.handleStatus_available, { exact: true }),
    ).toBeVisible();
    await page.unroute("**/v1/profile/handle?*");
    await page.route("**/v1/profile/handle?*", (route) =>
      route.fulfill({ status: 503, json: { code: "PROFILE_UNAVAILABLE" } }),
    );
    await profile.getByLabel("Handle", { exact: true }).fill("offline_handle");
    await expect(
      profile.getByText(en.identity.handleStatus_unknown, { exact: true }),
    ).toBeVisible();
    await page.unroute("**/v1/profile/handle?*");
    await profile.getByLabel("Handle", { exact: true }).fill(handle);
    await expect(
      profile.getByText(en.identity.handleStatus_available, { exact: true }),
    ).toBeVisible();
    await page.route("**/v1/profile/me", (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({ status: 503, json: { code: "PROFILE_UNAVAILABLE" } })
        : route.continue(),
    );
    await profile
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(profile.getByRole("alert")).toHaveText(
      en.identity.profileUnavailable,
    );
    expect(
      (await (await page.request.get("/api/v1/profile/me")).json()).profile,
    ).toBeNull();
    await expect(profile.getByLabel("Location", { exact: true })).toHaveValue(
      "Private R06 town",
    );
    await page.unroute("**/v1/profile/me");
    await page.route("**/v1/profile/me", (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({ status: 409, json: { code: "HANDLE_UNAVAILABLE" } })
        : route.continue(),
    );
    await profile
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(profile.getByRole("alert")).toHaveText(
      en.identity.handleUnavailable,
    );
    await expect(profile.getByLabel("Handle", { exact: true })).toHaveValue(
      handle,
    );
    await page.unroute("**/v1/profile/me");
    await profile
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(
      profile.getByText("Profile saved", { exact: true }),
    ).toBeVisible();
    await expect(profile.locator("details")).not.toHaveAttribute("open");
    await expect(
      profile.getByText("Private R06 town", { exact: true }),
    ).toBeVisible();
    const stored = (await page.request.get("/api/v1/profile/me")).json();
    expect((await stored).profile.interests).toEqual([
      ...presets.filter((tag) => tag !== "neon"),
      "coffee-friends",
    ]);
    const publicResponse = await page.request.get(
      `/api/v1/public-profiles/id/${userId}`,
    );
    expect(Object.keys((await publicResponse.json()).profile).sort()).toEqual([
      "bio",
      "handle",
      "id",
      "name",
    ]);
    await profile.getByText("Edit profile", { exact: true }).click();
    await profile
      .getByLabel("Location", { exact: true })
      .fill("Discard this town");
    await profile
      .getByRole("button", { name: "Cancel editing", exact: true })
      .click();
    await expect(
      profile.getByText("Private R06 town", { exact: true }),
    ).toBeVisible();
    await profile.getByText("Edit profile", { exact: true }).click();
    const original = (
      await (await page.request.get("/api/v1/profile/me")).json()
    ).profile;
    const { name, bio, favoriteVibe, version } = original;
    expect(
      (
        await page.request.put("/api/v1/profile/me", {
          headers: { origin: "http://127.0.0.1:3000" },
          data: {
            name,
            bio,
            favoriteVibe,
            version,
            handle,
            location: "Concurrent town",
          },
        })
      ).ok(),
    ).toBe(true);
    await profile.getByLabel("Location", { exact: true }).fill("Stale town");
    await profile
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(profile.getByRole("alert")).toHaveText(
      en.identity.staleProfile,
    );
    await profile
      .getByRole("button", { name: "Reload profile", exact: true })
      .click();
    await expect(profile.getByLabel("Location", { exact: true })).toHaveValue(
      "Concurrent town",
    );
    await profile
      .getByRole("button", { name: "Cancel editing", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".account")).toBeFocused();

    for (const [locale, messages] of Object.entries({ en, fr, es, ar })) {
      for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/${locale}/home`);
        await page.locator(".account").click();
        await profile
          .getByText(messages.identity.editProfile, { exact: true })
          .click();
        await expect(
          profile.getByLabel(messages.identity.location, { exact: true }),
        ).toHaveValue("Concurrent town");
        await expect(
          profile.getByLabel(messages.identity.telegramHandle, { exact: true }),
        ).toHaveValue("voyager");
        await expect(
          profile.getByLabel(messages.identity.cozyDiary, { exact: true }),
        ).toBeChecked();
        if (locale === "ar")
          await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        await menu
          .getByText(messages.identity.appearance, { exact: true })
          .click();
        for (const theme of ["light", "dark", "system"]) {
          await menu.locator(".select-control select").selectOption(theme);
          expect(
            await menu.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
        }
        await profile
          .getByLabel(messages.identity.location, { exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(`profile-${locale}-${width}.png`),
        });
        await profile
          .getByRole("button", {
            name: messages.identity.cancelProfile,
            exact: true,
          })
          .click();
        await page.keyboard.press("Escape");
      }
    }
  } finally {
    if (userId)
      await db.pool.query("DELETE FROM identity_users WHERE id=$1", [userId]);
    await db.close();
  }
});
