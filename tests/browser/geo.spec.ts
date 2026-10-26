import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { browserDatabase } from "./browser-database";
const users: string[] = [];
test.afterAll(async () => {
  const db = browserDatabase();
  try {
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users,
    ]);
  } finally {
    await db.close();
  }
});
async function register(context: BrowserContext) {
  const response = await context.request.post("/api/v1/identity/register", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      email: `r09-${randomUUID()}@example.test`,
      password: "Geo-browser!99",
    },
  });
  expect(response.status()).toBe(201);
  users.push((await response.json()).account.id);
}
async function enable(page: Page, context: BrowserContext) {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 36.811234,
    longitude: 10.181234,
    accuracy: 50,
  });
  await register(context);
  await page.goto("/en/home");
  await page
    .getByRole("button", { name: "Location access", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Access Request" });
  await expect(
    dialog.getByRole("button", { name: "Apply", exact: true }),
  ).toBeEnabled();
  await dialog.getByLabel("Geographic Location", { exact: true }).check();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByText("Device location active", { exact: true }),
  ).toBeVisible();
}
test("location entry reconstructs the shared Access Request controls without acquiring camera or microphone", async ({
  page,
}) => {
  await page.goto("/en/home");
  await page.getByRole("button", { name: "Location access" }).click();
  const dialog = page.getByRole("dialog", { name: "Access Request" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByLabel("Geographic Location", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Camera", { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Microphone", { exact: true })).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Apply", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".geo-entry button")).toBeFocused();
  await page.locator(".account").click();
  await page
    .locator(".profile-menu")
    .getByRole("button", { name: "Location access", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Access Request" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".profile-menu")).toBeVisible();
});
test("consent, real browser acquisition, reload, manual browsing and full withdrawal persist", async ({
  page,
  context,
}) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  await enable(page, context);
  const state = () =>
    context.request.get("/api/v1/geo/me").then((r) => r.json());
  expect(await state()).toMatchObject({
    locationConsent: true,
    socialSharing: false,
    presence: { latitude: 36.811234 },
  });
  await page.reload();
  await expect(
    page.getByText("Device location active", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Access Request" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage })),
  ).not.toContain("36.811234");
  await page.getByRole("link", { name: "Nearby area", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/explore/);
  await expect
    .poll(() => urls.some((url) => url.includes("/v1/geo/me/places")))
    .toBe(true);
  expect(
    urls.some((url) => url.includes("36.811234") || url.includes("10.181234")),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Browsing area", exact: true })
    .click();
  const area = page.getByRole("dialog");
  await expect(area.getByLabel("West longitude", { exact: true })).toHaveValue(
    "10.1",
  );
  await area.getByLabel("West longitude", { exact: true }).fill("10.2");
  await area.getByLabel("East longitude", { exact: true }).fill("10.3");
  await area.getByRole("button", { name: "Apply area", exact: true }).click();
  await expect(
    page.getByText("Selected browse area", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Location access", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Access Request" });
  await dialog.getByLabel("Geographic Location", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByText("Location consent is off.", { exact: true }),
  ).toBeVisible();
  expect((await state()).presence).toBeNull();
  await expect(
    page.getByText("Selected browse area", { exact: true }).first(),
  ).toBeVisible();
});
test("permission loss deletes presence while remembered consent and ordinary navigation survive", async ({
  page,
  context,
}) => {
  await enable(page, context);
  const other = await context.newPage();
  await other.goto("/en/home");
  await expect(
    other.getByRole("link", { name: "Nearby area", exact: true }),
  ).toBeVisible();
  await context.clearPermissions();
  await expect
    .poll(async () =>
      (await context.request.get("/api/v1/geo/me"))
        .json()
        .then((s) => s.presence),
    )
    .toBeNull();
  expect(
    (await (await context.request.get("/api/v1/geo/me")).json())
      .locationConsent,
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "Nearby area", exact: true }),
  ).toHaveCount(0);
  for (const tab of [page, other]) {
    await tab.locator(".geo-entry button").click();
    const access = tab.getByRole("dialog", { name: "Access Request" });
    await expect(
      access.getByLabel("Geographic Location", { exact: true }),
    ).toBeChecked();
    await expect(
      access.getByRole("button", { name: "Apply", exact: true }),
    ).toBeEnabled();
  }
  await other.close();
});
test("suspension ignores late readings, resume refreshes and logout removes server presence", async ({
  page,
  context,
}) => {
  await enable(page, context);
  const before = (await (await context.request.get("/api/v1/geo/me")).json())
    .presence.observedAt;
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await context.setGeolocation({
    latitude: 36.82,
    longitude: 10.19,
    accuracy: 25,
  });
  await page
    .getByRole("button", { name: "Refresh location", exact: true })
    .click();
  expect(
    (await (await context.request.get("/api/v1/geo/me")).json()).presence
      .observedAt,
  ).toBe(before);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(
      async () =>
        (await (await context.request.get("/api/v1/geo/me")).json()).presence
          ?.latitude,
    )
    .toBe(36.82);
  await page
    .getByRole("button", { name: "Your VibeQuest account", exact: true })
    .click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByText("Nearby area", { exact: true })).toHaveCount(0);
  const db = browserDatabase();
  try {
    expect(
      (
        await db.pool.query(
          "SELECT count(*)::int n FROM geo_positions WHERE user_id=$1",
          [users.at(-1)],
        )
      ).rows[0].n,
    ).toBe(0);
  } finally {
    await db.close();
  }
});
for (const failure of ["denied", "unavailable", "invalid"] as const)
  test(`${failure} device readings never become active presence`, async ({
    page,
    context,
  }) => {
    if (failure === "unavailable")
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "geolocation", {
          configurable: true,
          value: undefined,
        }),
      );
    if (failure === "invalid") {
      await context.grantPermissions(["geolocation"]);
      await context.setGeolocation({
        latitude: 36.8,
        longitude: 10.2,
        accuracy: 101,
      });
    }
    await register(context);
    await page.goto("/en/home");
    await page.locator(".geo-entry button").click();
    const dialog = page.getByRole("dialog", { name: "Access Request" });
    await expect(
      dialog.getByRole("button", { name: "Apply", exact: true }),
    ).toBeEnabled();
    await dialog.getByLabel("Geographic Location", { exact: true }).check();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    const expected =
      failure === "denied"
        ? "Location permission denied. You can still browse manually."
        : failure === "unavailable"
          ? "Device location unavailable. You can still browse manually."
          : "The reading is too old, inaccurate or invalid. Please refresh.";
    await expect(page.getByText(expected, { exact: true })).toBeVisible();
    expect(
      (await (await context.request.get("/api/v1/geo/me")).json()).presence,
    ).toBeNull();
  });
test("a suspended in-flight callback cannot publish a reading", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback) {
          (window as Window & { finishGeo?: () => void }).finishGeo = () =>
            success({
              coords: { latitude: 36.8, longitude: 10.2, accuracy: 20 },
              timestamp: Date.now(),
            } as GeolocationPosition);
        },
      },
    });
  });
  await register(context);
  await page.goto("/en/home");
  await page.locator(".geo-entry button").click();
  const dialog = page.getByRole("dialog", { name: "Access Request" });
  await expect(
    dialog.getByRole("button", { name: "Apply", exact: true }),
  ).toBeEnabled();
  await dialog.getByLabel("Geographic Location", { exact: true }).check();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByText("Getting your location…", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    (window as Window & { finishGeo?: () => void }).finishGeo?.();
  });
  expect(
    (await (await context.request.get("/api/v1/geo/me")).json()).presence,
  ).toBeNull();
});
test("withdrawal immediately invalidates another open tab without broadcasting coordinates", async ({
  page,
  context,
}) => {
  await enable(page, context);
  const other = await context.newPage();
  await other.goto("/en/home");
  await expect(
    other.getByRole("link", { name: "Nearby area", exact: true }),
  ).toBeVisible();
  await page.bringToFront();
  await page.locator(".geo-entry button").click();
  const dialog = page.getByRole("dialog", { name: "Access Request" });
  await dialog.getByLabel("Geographic Location", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    other.getByRole("link", { name: "Nearby area", exact: true }),
  ).toHaveCount(0);
  await other.close();
});
test("a delayed initial read cannot restore presence after platform permission loss", async ({
  page,
  context,
}) => {
  await enable(page, context);
  let release: () => void = () => {},
    captured = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/geo/me", async (route) => {
    const response = await route.fetch();
    captured = true;
    await gate;
    await route.fulfill({ response });
  });
  const delayed = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url().endsWith("/api/v1/geo/me"),
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => captured).toBe(true);
  await context.clearPermissions();
  await expect
    .poll(
      async () =>
        (await (await context.request.get("/api/v1/geo/me")).json()).presence,
    )
    .toBeNull();
  release();
  await delayed;
  await page.unroute("**/api/v1/geo/me");
  await expect(
    page.getByRole("link", { name: "Nearby area", exact: true }),
  ).toHaveCount(0);
});
test("expired device-area presentation is suppressed without a new observation", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date() });
  await enable(page, context);
  await page.clock.fastForward(16 * 60_000);
  await expect(
    page.getByText("Location expired. Refresh or browse manually.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nearby area", exact: true }),
  ).toHaveCount(0);
});
for (const locale of ["en", "fr", "es", "ar"])
  for (const width of [320, 390, 430])
    test(`${locale} ${width}px permission layout fits light and dark`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ["light", "dark"]) {
        await page.addInitScript(
          (value) => localStorage.setItem("vq.theme", value),
          theme,
        );
        await page.goto(`/${locale}/home`);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
        await page.locator(".geo-entry button").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        expect(
          await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (width === 390)
          await page.screenshot({ path: `.local/geo-${locale}-${theme}.png` });
      }
    });
