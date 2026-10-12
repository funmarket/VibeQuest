import { openPreferences, setTheme } from "./profile-controls";
import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const destinations = ["home", "explore", "share", "vibe", "purse"];
const widths = [360, 390, 393, 412, 430, 768, 820, 1024, 1280];
const css = readFileSync("packages/ui/src/tokens.css", "utf8");
function palette(theme: string) {
  const selector = theme === "dark" ? '[data-theme="dark"]' : ":root";
  const block = css.slice(css.indexOf(selector)).split("}")[0]!;
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => {
      const rgb = [1, 3, 5].map((start) =>
        parseInt(match[2]!.slice(start, start + 2), 16),
      );
      return [match[1], `rgb(${rgb.join(", ")})`];
    }),
  );
}

// Real ordinary-browser rendering: no intercepted API/SDK, fake host or records.
for (const locale of ["en", "ar", "fr", "es"]) {
  const localeWidths =
    locale === "en" || locale === "ar" ? widths : [390, 820, 1280];
  for (const width of localeWidths) {
    for (const theme of ["light", "dark"]) {
      test(`${locale} ${theme} ${width}px: canonical surfaces and layout`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/home`);
        await setTheme(page, theme);
        const colors = palette(theme);
        for (const destination of destinations) {
          await page.goto(`/${locale}/${destination}`);
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            theme,
          );
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          await expect(page.locator(".app-shell")).toHaveAttribute(
            "data-host",
            "browser",
          );
          await expect(page.locator("h1")).toBeVisible();
          await expect(page.locator(".bottom-nav a")).toHaveCount(5);
          const rendered = await page.evaluate(() => ({
            background: getComputedStyle(document.body).backgroundColor,
            text: getComputedStyle(document.body).color,
            surface: getComputedStyle(document.querySelector(".bottom-nav")!)
              .backgroundColor,
            border: getComputedStyle(document.querySelector(".bottom-nav")!)
              .borderTopColor,
            raised: getComputedStyle(document.querySelector(".account")!)
              .backgroundColor,
            muted: getComputedStyle(
              document.querySelector(
                ".page-heading p, .share-hero p, .home-flash-layout p",
              )!,
            ).color,
            clipped: document.documentElement.scrollWidth > innerWidth,
          }));
          expect(rendered).toEqual({
            background: colors.bg,
            text: colors.text,
            surface: colors.surface,
            border: colors.border,
            raised: colors.raised,
            muted: colors.muted,
            clipped: false,
          });
          if (destination === "vibe") {
            await expect(page.locator(".vibe-capsule")).toHaveCSS(
              "background-color",
              colors.capsule!,
            );
            await expect(page.locator(".vibe-capsule")).toHaveCSS(
              "color",
              colors["capsule-text"]!,
            );
          }
          await testInfo.attach(`${destination}-computed-colors`, {
            body: JSON.stringify(rendered),
            contentType: "application/json",
          });
          if ([390, 820, 1280].includes(width)) {
            await page.screenshot({
              path: `docs/operations/evidence/design-tokens-003/after/${destination}-${locale}-${theme}-${width}.png`,
              fullPage: true,
            });
          }
          await page.locator(".account").click();
          const dialog = page.getByRole("dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog).toHaveCSS("background-color", colors.surface!);
          await expect(dialog).toHaveCSS("color", colors.text!);
          expect(
            await dialog.evaluate((el) => {
              const box = el.getBoundingClientRect();
              return box.left >= 0 && box.right <= innerWidth;
            }),
          ).toBe(true);
          if (destination === "explore" && width === 390) {
            await page.screenshot({
              path: `docs/operations/evidence/design-tokens-003/after/dialog-${locale}-${theme}-390.png`,
              fullPage: true,
            });
          }
          await page.keyboard.press("Escape");
          await expect(dialog).toHaveCount(0);
          await page.keyboard.press("Tab");
          await page.locator(".select-control select").focus();
          await expect(page.locator(".select-control select")).toHaveCSS(
            "outline-color",
            colors.focus!,
          );
          await page.evaluate(() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "instant",
            }),
          );
          const end = await page.locator("[data-page-end]").boundingBox();
          const bar = await page.locator(".bottom-nav").boundingBox();
          expect(end!.y + end!.height).toBeLessThanOrEqual(bar!.y + 1);
        }
      });
    }
  }
}

test("real controls persist explicit themes and system responds to browser color-scheme media changes", async ({
  page,
}) => {
  await page.goto("/en/home");
  await openPreferences(page);
  const control = page.locator(".select-control select");
  await control.selectOption("dark");
  await page.reload();
  await openPreferences(page);
  await expect(control).toHaveValue("dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    palette("dark").bg!,
  );
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await control.selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    palette("dark").bg!,
  );
  await control.selectOption("light");
  await page.reload();
  await openPreferences(page);
  await expect(control).toHaveValue("light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    palette("light").bg!,
  );
});

test("persisted dark startup has a dark first rendered frame", async ({
  page,
}, testInfo) => {
  await page.goto("/en/home");
  await setTheme(page, "dark");
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      Object.assign(window, {
        firstThemeFrame: {
          theme: document.documentElement.dataset.theme,
          background: document.body
            ? getComputedStyle(document.body).backgroundColor
            : null,
        },
      });
    });
  });
  await page.reload();
  await openPreferences(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { firstThemeFrame?: { theme?: string } })
            .firstThemeFrame?.theme,
      ),
    )
    .toBe("dark");
  const firstFrame = await page.evaluate(
    () =>
      (
        window as unknown as {
          firstThemeFrame: { theme: string; background: string | null };
        }
      ).firstThemeFrame,
  );
  expect(firstFrame.background).toBe(palette("dark").bg);
  await testInfo.attach("startup-first-frame", {
    body: JSON.stringify(firstFrame),
    contentType: "application/json",
  });
});
