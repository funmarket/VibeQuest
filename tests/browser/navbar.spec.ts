import { setTheme } from "./profile-controls";
import { test, expect } from "@playwright/test";

const destinations = ["home", "explore", "share", "vibe", "purse"];
for (const locale of ["en", "ar", "fr", "es"]) {
  const widths =
    locale === "en"
      ? [320, 360, 390, 393, 412, 430, 768, 820, 1024, 1280]
      : locale === "ar"
        ? [360, 390, 768, 1280]
        : [320, 360, 390];
  for (const width of widths) {
    for (const theme of ["light", "dark"]) {
      test(`${locale} ${theme} ${width}: active pills and contained heart`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/${locale}/home`);
        await expect
          .poll(async () => {
            await setTheme(page, theme);
            return page.locator("html").getAttribute("data-theme");
          })
          .toBe(theme);
        for (const destination of destinations) {
          await page.locator(`.nav-${destination}`).click();
          await expect(page).toHaveURL(
            new RegExp(`/${locale}/${destination}$`),
          );
          await expect(page.locator(`.nav-${destination}`)).toHaveAttribute(
            "aria-current",
            "page",
          );
          await expect(page.locator(".bottom-nav a")).toHaveCount(5);
          const bounds = await page.locator(".bottom-nav").boundingBox();
          const items = await page
            .locator(".bottom-nav a")
            .evaluateAll((links) =>
              links.map((el) => {
                const box = el.getBoundingClientRect();
                const label = el.querySelector(".nav-label");
                const text = label?.getBoundingClientRect();
                const border = parseFloat(getComputedStyle(el).borderLeftWidth);
                return {
                  width: box.width,
                  height: box.height,
                  radius: parseFloat(getComputedStyle(el).borderRadius),
                  labelFits:
                    !text ||
                    (text.left >= box.left + border + 2 &&
                      text.right <= box.right - border - 2),
                };
              }),
            );
          for (const item of items) {
            expect([40, 44]).toContain(item.height);
            expect(item.width).toBeGreaterThanOrEqual(item.height);
            expect(item.radius).toBe(items[0]!.radius);
            expect(item.labelFits).toBe(true);
          }
          for (const element of await page
            .locator(".bottom-nav a, .bottom-nav .nav-icon, .bottom-nav svg")
            .all()) {
            const box = await element.boundingBox();
            expect(box!.y).toBeGreaterThanOrEqual(bounds!.y);
            expect(box!.y + box!.height).toBeLessThanOrEqual(
              bounds!.y + bounds!.height,
            );
            expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
            expect(box!.x + box!.width).toBeLessThanOrEqual(
              bounds!.x + bounds!.width,
            );
          }
          const current = page.locator('.bottom-nav [aria-current="page"]');
          await expect(current).not.toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
          );
          if (theme === "dark") {
            await expect(current).toHaveCSS("color", "rgb(255, 255, 255)");
          }
          await expect(page.locator(".nav-share svg")).toHaveAttribute(
            "fill",
            "none",
          );
          await expect(page.locator(".nav-share .nav-label")).toBeVisible();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
          ).toBe(false);
          if (width === 390) {
            await page.locator(".bottom-nav").screenshot({
              path: `.local/navbar/evidence/${destination}-${locale}-${theme}.png`,
            });
          }
        }
      });
    }
  }
}
