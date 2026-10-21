import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { browserDatabase } from "./browser-database";
import { openPreferences, setLocale } from "./profile-controls";

test("guest preferences and real account lifecycle use the canonical profile menu", async ({
  page,
}) => {
  test.setTimeout(120000);
  const database = browserDatabase();
  const email = `browser-${randomUUID()}@example.test`;
  try {
    await page.goto("/en/home");
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    const menu = page.getByRole("dialog", { name: "Voyager Console" });
    await expect(menu).toBeVisible();
    await menu.getByText("Appearance", { exact: true }).click();
    await menu.getByRole("combobox", { name: "Theme" }).selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await menu
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await menu.getByLabel("Email", { exact: true }).fill(email);
    await menu
      .getByLabel("Password", { exact: true })
      .fill("Actual-browser-account!79");
    await menu.getByRole("button", { name: "Register", exact: true }).click();
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await menu.getByText("Edit profile", { exact: true }).click();
    await menu
      .getByLabel("Name", { exact: true })
      .fill("Browser verification profile");
    await menu
      .getByLabel("Biography", { exact: true })
      .fill("Genuine persisted profile, removed after the test.");
    await menu
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(
      menu.getByText("Profile complete", { exact: true }),
    ).toBeVisible();
    await menu.getByLabel("Profile photo", { exact: true }).setInputFiles({
      name: "verified-upload.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await expect(
      menu.getByRole("img", { name: "Profile photo" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        menu
          .getByRole("img", { name: "Profile photo" })
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(1);
    const originalSource = await menu
      .getByRole("img", { name: "Profile photo" })
      .getAttribute("src");
    const oldId = originalSource!.split("/")[4];
    await menu.getByLabel("Profile photo", { exact: true }).setInputFiles({
      name: "replacement-upload.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
        "base64",
      ),
    });
    await expect(
      menu.getByRole("img", { name: "Profile photo" }),
    ).not.toHaveAttribute("src", originalSource!);
    await expect
      .poll(() =>
        menu
          .getByRole("img", { name: "Profile photo" })
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(1);
    await menu
      .getByRole("button", { name: "Remove photo", exact: true })
      .click();
    await expect(menu.getByRole("img", { name: "Profile photo" })).toHaveCount(
      0,
    );
    // Observe the actual API worker, not a browser-generated cleanup result.
    await expect
      .poll(
        async () =>
          (
            await database.pool.query(
              "SELECT id FROM media_objects WHERE id=$1",
              [oldId],
            )
          ).rowCount,
        { timeout: 75000 },
      )
      .toBe(0);
    await page.reload();
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    await expect(
      page.getByRole("dialog").getByText(email, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Log in", exact: true }),
    ).toBeVisible();
    await menu.getByLabel("Email", { exact: true }).fill(email);
    await menu
      .getByLabel("Password", { exact: true })
      .fill("Actual-browser-account!79");
    await menu.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await menu.getByRole("button", { name: "Log out", exact: true }).click();
  } finally {
    await database.pool.query(
      "DELETE FROM identity_users WHERE id IN (SELECT user_id FROM identity_password_accounts WHERE email=$1)",
      [email],
    );
    await database.close();
  }
});

for (const locale of ["en", "fr", "ar", "es"]) {
  for (const width of [320, 390, 430, 768, 1280]) {
    test(`guest profile preferences ${locale} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${locale}/home`);
      await expect(page.locator(".app-header select")).toHaveCount(0);
      await openPreferences(page);
      const drawer = page.locator(".profile-menu");
      await expect
        .poll(async () => {
          const box = (await drawer.boundingBox())!;
          return Math.abs(box.x + box.width - width);
        })
        .toBeLessThan(1);
      const box = (await drawer.boundingBox())!;
      expect(box.width).toBeCloseTo(Math.min(width * 0.8, 340), 0);
      expect(box.height).toBe(844);
      expect(
        await drawer.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      const control = page.locator(".select-control select");
      for (const theme of ["dark", "light", "system"]) {
        await control.selectOption(theme);
        const expected =
          theme === "system"
            ? await page.evaluate(() =>
                matchMedia("(prefers-color-scheme: dark)").matches
                  ? "dark"
                  : "light",
              )
            : theme;
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          expected,
        );
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.keyboard.press("Escape");
      await expect(page.locator(".profile-menu")).toHaveCount(0);
      await expect(page.locator(".account")).toBeFocused();
      await setLocale(page, locale === "ar" ? "en" : "ar");
      await expect(page).toHaveURL(
        new RegExp(`/${locale === "ar" ? "en" : "ar"}/home$`),
      );
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "ltr" : "rtl",
      );
      await page.goto("/telegram");
      await expect(page).toHaveURL(
        new RegExp(`/${locale === "ar" ? "en" : "ar"}/home$`),
      );
    });
  }
}

test("R03 drawer is right-aligned and bounded on a narrow phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/en/home");
  await page.locator(".account").click();
  const drawer = page.locator(".profile-menu");
  await expect(drawer).toBeVisible();
  await expect
    .poll(async () => {
      const b = await drawer.boundingBox();
      return Math.abs(b!.x + b!.width - 320);
    })
    .toBeLessThan(1);
  const b = await drawer.boundingBox();
  expect(b!.width).toBeCloseTo(256, 4);
  expect(b!.height).toBe(844);
});

test("R03 close paths, focus, background lock, nested controls and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/home");
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  const scroll = await page.evaluate(() => scrollY);
  const drawer = page.locator(".profile-menu");
  const open = async () => {
    await page.locator(".account").click();
    await expect(drawer).toBeVisible();
    expect(
      await drawer.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    expect(
      await drawer.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
  };
  await open();
  await page.keyboard.press("Shift+Tab");
  expect(
    await drawer.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.mouse.move(10, 250);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll);
  const email = drawer.getByLabel("Email", { exact: true });
  await email.fill("selection@example.test");
  await email.press("Control+a");
  expect(await email.evaluate((el: HTMLInputElement) => el.value)).toBe(
    "selection@example.test",
  );
  await email.press("Tab");
  await page.keyboard.type("Preserved-password!79");
  await expect(drawer.getByLabel("Password", { exact: true })).toHaveValue(
    "Preserved-password!79",
  );
  const password = drawer.getByLabel("Password", { exact: true });
  await password.press("Control+a");
  expect(
    await password.evaluate(
      (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
    ),
  ).toBe("Preserved-password!79".length);
  expect(await drawer.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await drawer.locator(".profile-menu-heading .icon-button").click();
  await expect(drawer).toHaveCount(0);
  await expect(page.locator(".account")).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await open();
  await page.mouse.click(10, 250);
  await expect(drawer).toHaveCount(0);
  await expect(page.locator(".account")).toBeFocused();
  await open();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    ),
  ).not.toBe("hidden");
  await page.locator(".notifications").click();
  await expect(page.locator(".notice-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".notifications")).toBeFocused();
});

for (const locale of ["en", "ar"]) {
  test(`R03 right drag, velocity and cancellation ${locale}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 844 });
    await page.goto(`/${locale}/home`);
    const drawer = page.locator(".profile-menu");
    const open = async () => {
      await page.locator(".account").click();
      await expect
        .poll(async () => Math.abs((await drawer.boundingBox())!.x - 90))
        .toBeLessThan(1);
    };
    const drag = async (offset: number, hold: boolean) => {
      // Blank heading edge, away from text and the X control in either direction.
      await page.mouse.move(94, 30);
      await page.mouse.down();
      await page.mouse.move(94 + offset, 30, { steps: hold ? 5 : 1 });
      if (hold) await page.waitForTimeout(220); // Deliberately remove flick velocity.
      await page.mouse.up();
    };
    await open();
    await drag(50, true);
    await expect(drawer).toBeVisible();
    await expect
      .poll(async () => Math.abs((await drawer.boundingBox())!.x - 90))
      .toBeLessThan(1);
    await drag(100, true);
    await expect(drawer).toHaveCount(0);
    await open();
    await drag(70, false);
    await expect(drawer).toHaveCount(0);
    await open();
    await page.mouse.move(94, 30);
    await page.mouse.down();
    await page.mouse.move(125, 30);
    await drawer.dispatchEvent("pointercancel");
    await page.mouse.up();
    await expect
      .poll(async () => Math.abs((await drawer.boundingBox())!.x - 90))
      .toBeLessThan(1);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  });
}

test("R03 browser Back closes Console when the route changes", async ({
  page,
}) => {
  await page.goto("/en/home");
  await page.locator(".nav-vibe").click();
  await page.locator(".account").click();
  await expect(page.locator(".profile-menu")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/en/home");
  await expect(page.locator(".profile-menu")).toHaveCount(0);
});

test("R03 touch swipe and vertical form scrolling remain independent", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 600 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:3000/en/home");
    await page.locator(".account").tap();
    const drawer = page.locator(".profile-menu");
    await expect
      .poll(async () => Math.abs((await drawer.boundingBox())!.x - 78))
      .toBeLessThan(1);
    const touch = await context.newCDPSession(page);
    const send = (
      type: "touchStart" | "touchMove" | "touchEnd",
      x: number,
      y: number,
    ) =>
      touch.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    const email = drawer.getByLabel("Email", { exact: true });
    await email.fill("touch@example.test");
    const field = (await email.boundingBox())!;
    const y = Math.min(field.y + 15, 540);
    await send("touchStart", 230, y);
    for (let step = 1; step <= 6; step++)
      await send("touchMove", 230, y - step * 30);
    await send("touchEnd", 230, y - 180);
    await expect(drawer).toBeVisible();
    await expect(email).toHaveValue("touch@example.test");
    await expect
      .poll(() => drawer.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    await drawer.evaluate((el) => el.scrollTo(0, 0));
    await send("touchStart", 82, 30);
    for (let step = 1; step <= 6; step++)
      await send("touchMove", 82 + step * 20, 30);
    await send("touchEnd", 202, 30);
    await expect(drawer).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("R03 rendered drawer samples", async ({ page }, testInfo) => {
  for (const [locale, width, theme] of [
    ["en", 320, "light"],
    ["ar", 390, "dark"],
    ["es", 430, "system"],
    ["fr", 1280, "dark"],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/${locale}/home`);
    await openPreferences(page);
    await page.locator(".select-control select").selectOption(theme);
    await expect
      .poll(async () =>
        Math.abs(
          (await page.locator(".profile-menu").boundingBox())!.x +
            Math.min(width * 0.8, 340) -
            width,
        ),
      )
      .toBeLessThan(1);
    await page.screenshot({
      path: testInfo.outputPath(`console-${locale}-${width}-${theme}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(page.locator(".profile-menu")).toHaveCount(0);
  }
});
