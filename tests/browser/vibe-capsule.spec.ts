import { test, expect } from "@playwright/test";
import { setTheme } from "./profile-controls";

test.setTimeout(60_000);

for (const locale of ["en", "ar"]) {
  for (const theme of ["dark", "light"]) {
    for (const width of [390, 430]) {
      test(`Vibe Share reference capsule: ${locale} ${theme} ${width}`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/vibe`);
        await setTheme(page, theme);
        const capsule = page.locator(".vibe-capsule");
        await expect(capsule.locator(".capsule-title")).toHaveCSS(
          "color",
          "rgb(255, 255, 255)",
        );
        await expect(capsule).toHaveCSS("border-top-width", "2px");
        await expect(capsule).toHaveCSS(
          "border-top-color",
          "rgb(212, 175, 55)",
        );
        for (const dial of await capsule.locator(".capsule-dial").all()) {
          await expect(dial).toHaveCSS(
            "background-color",
            "rgb(255, 255, 255)",
          );
          await expect(dial).toHaveCSS("border-top-width", "3px");
          await expect(dial.locator("svg")).toHaveCSS(
            "color",
            "rgb(16, 16, 16)",
          );
          await expect(dial.locator("svg")).toHaveCSS("fill", "none");
          await expect(dial.locator("svg")).toHaveCSS("width", "32px");
        }
        const box = await capsule.boundingBox();
        const title = await capsule.locator(".capsule-title").boundingBox();
        expect(title!.x).toBeGreaterThan(box!.x + 58);
        expect(title!.x + title!.width).toBeLessThan(box!.x + box!.width - 58);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
        ).toBe(false);
        for (const button of await capsule.getByRole("button").all()) {
          await button.focus();
          await page.keyboard.press("Enter");
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await expect(button).toBeFocused();
        }
        // Record the resting appearance after verifying visible keyboard focus.
        await page.getByRole("heading", { level: 1 }).click();
        await capsule.screenshot({
          path: info.outputPath("vibe-share-capsule.png"),
        });
      });
    }
  }
}
