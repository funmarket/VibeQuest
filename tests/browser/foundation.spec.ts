import { openPreferences, setTheme, setLocale } from "./profile-controls";
import { test, expect } from "@playwright/test";

const destinations = ["home", "explore", "share", "vibe", "purse"] as const;
const widths = [360, 390, 393, 412, 430, 768, 820, 1024, 1280];

// Ordinary-browser acceptance deliberately has no SDK global. Host simulations
// live separately; this transport substitution grants no identity or API data.
test.beforeEach(async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" }),
  );
});

for (const width of widths) {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} ${width}px: all five pages stay navigable and clear of the bottom bar`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (value) => localStorage.setItem("vq.theme", value),
        theme,
      );
      for (const destination of destinations) {
        await page.goto(`/en/${destination}`);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const nav = page.getByRole("navigation", {
          name: "Primary navigation",
        });
        await expect(nav.getByRole("link")).toHaveCount(5);
        await expect(nav.getByRole("link", { name: /^Share$/ })).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          }),
        );
        const end = await page.locator("[data-page-end]").boundingBox();
        const bar = await nav.boundingBox();
        expect(end!.y + end!.height).toBeLessThanOrEqual(bar!.y + 1);
        await page.screenshot({
          path: `docs/operations/evidence/${destination}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    });
  }
}

for (const locale of ["en", "fr", "ar", "es"]) {
  test(`${locale}: five destinations and subnavigation work without Telegram globals`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const destination of destinations) {
      await page.goto(`/${locale}/${destination}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () => typeof (window as unknown as { Telegram?: unknown }).Telegram,
        ),
      ).toBe("undefined");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `docs/operations/evidence/${destination}-${locale}-390.png`,
        fullPage: true,
      });
      const nav = page.getByRole("navigation").last();
      await expect(nav.getByRole("link")).toHaveCount(5);
      await nav
        .getByRole("link")
        .nth((destinations.indexOf(destination) + 1) % 5)
        .click();
      await expect(page).toHaveURL(
        new RegExp(
          `/${locale}/${destinations[(destinations.indexOf(destination) + 1) % 5]}$`,
        ),
      );
    }
    await page.goto(`/${locale}/vibe`);
    for (const tab of ["gossip", "drift", "vibes", "orbit", "echo"]) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await expect(page.locator(`[data-tab="${tab}"]`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.getByRole("tabpanel")).toBeVisible();
    }
    await page.goto(`/${locale}/purse`);
    await page.locator('[data-tab="p2p"]').click();
    await expect(page.locator('[data-tab="p2p"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.screenshot({
      path: `docs/operations/evidence/purse-${locale}-390.png`,
      fullPage: true,
    });
  });
}

test("theme persists and follows OS changes only when system is selected", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/home");
  await setTheme(page, "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await setTheme(page, "dark");
  await page.reload();
  await openPreferences(page);
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("locale preference, tab keyboard navigation and dialog focus work in RTL", async ({
  page,
}) => {
  await page.goto("/en/vibe");
  await setLocale(page, "ar");
  await expect(page).toHaveURL("/ar/vibe");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator('[data-tab="gossip"]').focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-tab="drift"]')).toBeFocused();
  await expect(page.locator('[data-tab="drift"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("End");
  await expect(page.locator('[data-tab="pulls"]')).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator('[data-tab="gossip"]')).toBeFocused();
  await page.goto("/");
  await expect(page).toHaveURL("/ar/home");
  await page.goto("/en/explore");
  const trigger = page.getByRole("button", {
    name: "Suggest a Place",
    exact: true,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Explore reads the actual loopback API and shows honest map unavailability", async ({
  page,
}) => {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/v1/places?"),
  );
  await page.goto("/en/explore");
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ places: [] });
  await expect(
    page.getByText("No published places in this area."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.locator(".map-unavailable")).toContainText("Map");
});

test("Telegram entry shares navigation and safely falls back in an ordinary browser", async ({
  page,
}) => {
  await page.goto("/telegram");
  await expect(page).toHaveURL("/en/home");
  await expect(
    page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link"),
  ).toHaveCount(5);
  await expect(page.locator("[data-host]")).toHaveAttribute(
    "data-host",
    "browser",
  );
});

test("Explore distinguishes empty, failure, retry and pending contribution actions", async ({
  page,
}) => {
  await page.route("**/api/v1/places?*", (route) =>
    route.fulfill({ json: { places: [] } }),
  );
  await page.goto("/en/explore");
  await expect(
    page.getByText("No published places in this area."),
  ).toBeVisible();
  await page.unroute("**/api/v1/places?*");
  await page.route("**/api/v1/places?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: "PLACES_UNAVAILABLE" } },
    }),
  );
  await page.reload();
  await openPreferences(page);
  await expect(page.getByText("Places could not be loaded.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.unroute("**/api/v1/places?*");
  await page.route("**/api/v1/places?*", (route) =>
    route.fulfill({ json: { places: [] } }),
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText("No published places in this area."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Suggest a Place", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Submission is not available yet.",
  );
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Submit" }),
  ).toHaveCount(0);
});
