import { test, expect, type Page } from "@playwright/test";
import { openPreferences, setTheme } from "./profile-controls";
test.setTimeout(60000);

async function headerGeometry(page: Page) {
  return page.locator(".app-header").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const brand = el.querySelector(".brand")!.getBoundingClientRect();
    const tools = el.querySelector(".header-tools")!.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      overflow: document.documentElement.scrollWidth > innerWidth,
      controlsFit: [...el.querySelectorAll(".icon-button")].every((button) => {
        const box = button.getBoundingClientRect();
        return (
          box.width >= 44 &&
          box.height >= 44 &&
          box.left >= 0 &&
          box.right <= innerWidth
        );
      }),
      brandFits:
        brand.left >= 0 &&
        brand.right <= innerWidth &&
        (document.dir === "rtl"
          ? tools.right <= brand.left
          : brand.right <= tools.left),
      brandTextFits: [
        ...el.querySelectorAll(".brand-type, .brand-type small"),
      ].every((text) => text.scrollWidth <= text.clientWidth + 1),
    };
  });
}

for (const [locale, width] of [
  ["en", 320],
  ["ar", 390],
  ["en", 430],
  ["en", 1280],
] as const) {
  test(`${locale} ${width}: persistent header preserves document navigation`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/${locale}/home`);
    await expect(page.locator(".app-header")).toHaveCount(1);
    await expect(page.locator(".header-tools .icon-button")).toHaveCount(3);
    for (const destination of ["home", "explore", "share", "vibe", "purse"]) {
      await page.goto(`/${locale}/${destination}`);
      const initial = await headerGeometry(page);
      expect(initial.controlsFit).toBe(true);
      expect(initial.brandFits).toBe(true);
      expect(initial.brandTextFits).toBe(true);
      expect(initial.overflow).toBe(false);
      expect(
        (await page.locator("#main").boundingBox())!.y,
      ).toBeGreaterThanOrEqual(initial.bottom);
      if (
        await page.evaluate(
          () => document.documentElement.scrollHeight - innerHeight > 30,
        )
      ) {
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(20);
        await expect
          .poll(async () => Math.abs((await headerGeometry(page)).top))
          .toBeLessThan(1);
        await expect(page.locator(".bottom-nav")).toHaveAttribute(
          "data-scroll-hidden",
          "true",
        );
        if (destination === "home")
          await page.screenshot({
            path: `.local/r02/evidence/scrolled-${locale}-${width}.png`,
          });
        await page.evaluate(() => window.scrollBy(0, -30));
        await expect(page.locator(".bottom-nav")).toHaveAttribute(
          "data-scroll-hidden",
          "false",
        );
      }
      await expect(page.locator(".bottom-nav a")).toHaveCount(5);
    }
    await page.locator(".brand").click();
    await expect(page).toHaveURL(`/${locale}/home`);
    await expect(page.locator(".bottom-nav")).toHaveAttribute(
      "data-scroll-hidden",
      "false",
    );
    await page.screenshot({
      path: `.local/r02/evidence/header-${locale}-${width}.png`,
    });
    await testInfo.attach("header geometry", {
      body: JSON.stringify(await headerGeometry(page)),
      contentType: "application/json",
    });
  });
}

const labels = {
  en: ["Switch to dark theme", "Switch to light theme"],
  fr: ["Passer au thème sombre", "Passer au thème clair"],
  es: ["Cambiar al tema oscuro", "Cambiar al tema claro"],
  ar: ["التبديل إلى المظهر الداكن", "التبديل إلى المظهر الفاتح"],
};
for (const locale of ["en", "fr", "es", "ar"] as const) {
  test(`${locale}: quick theme persists through the existing preference owner`, async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on("console", (message) => {
      if (/hydration|did not match|server rendered HTML/i.test(message.text()))
        hydrationErrors.push(message.text());
    });
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`/${locale}/home`);
    await expect
      .poll(async () => (await headerGeometry(page)).brandTextFits)
      .toBe(true);
    expect((await headerGeometry(page)).brandFits).toBe(true);
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "light");
    await page
      .getByRole("button", { name: labels[locale][0], exact: true })
      .press("Enter");
    await expect(root).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("vq.theme"))).toBe(
      "dark",
    );
    await openPreferences(page);
    await expect(page.locator(".profile-menu select").first()).toHaveValue(
      "dark",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".account")).toBeFocused();
    await page.reload();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await page
      .getByRole("button", { name: labels[locale][1], exact: true })
      .click();
    await expect(root).toHaveAttribute("data-theme", "light");
    await setTheme(page, "system");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(
      page.getByRole("button", { name: labels[locale][1], exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("vq.theme"))).toBe(
      "system",
    );
    expect(hydrationErrors).toEqual([]);
  });
}

test("header safe-area clearance, skip link and nested dialog scrolling remain independent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/explore");
  // Presentation-only long label fixture; no account/session or API response is fabricated.
  await page.locator(".guest-label").evaluate((el) => {
    el.textContent = "Long account label layout fixture ".repeat(6);
  });
  expect((await headerGeometry(page)).overflow).toBe(false);
  // Isolated CSS geometry input, not a claim of real Telegram/device acceptance.
  await page.locator(".app-shell").evaluate((el) => {
    (el as HTMLElement).style.setProperty("--host-safe-top", "25px");
    (el as HTMLElement).style.setProperty("--host-safe-bottom", "22px");
  });
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect
    .poll(() =>
      page
        .locator(".app-header")
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(1);
  expect(
    (await page.locator(".brand").boundingBox())!.y,
  ).toBeGreaterThanOrEqual(25);
  await page.locator(".account").click();
  const dialog = page.locator(".profile-menu");
  await expect(dialog).toBeVisible();
  const before = await page.evaluate(() => ({
    y: scrollY,
    nav: document
      .querySelector(".bottom-nav")!
      .getAttribute("data-scroll-hidden"),
  }));
  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect
    .poll(() =>
      page.evaluate(() => ({
        y: scrollY,
        nav: document
          .querySelector(".bottom-nav")!
          .getAttribute("data-scroll-hidden"),
      })),
    )
    .toEqual(before);
  await page.keyboard.press("Escape");
  await expect(page.locator(".account")).toBeFocused();
  await page.locator(".notifications").click();
  await expect(page.locator(".notice-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".notifications")).toBeFocused();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator("#main")).toBeFocused();
  expect((await page.locator("#main").boundingBox())!.y).toBeGreaterThanOrEqual(
    (await page.locator(".app-header").boundingBox())!.height,
  );
  await expect(page.locator(".bottom-nav")).toHaveCSS(
    "transition-duration",
    "0s",
  );
});
