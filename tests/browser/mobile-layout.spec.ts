import { test, expect } from "@playwright/test";
import { setTheme } from "./profile-controls";

const widths = [320, 360, 375, 390, 393, 412, 430, 768, 1024, 1280];
const locales = ["en", "fr", "es", "ar"];
test.describe.configure({ mode: "parallel" });

for (const locale of locales) {
  for (const theme of ["dark", "light"] as const) {
    for (const width of widths) {
      test(`${locale} ${theme} ${width}: real content geometry`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/${locale}/home`);
        await setTheme(page, theme);
        for (const destination of [
          "home",
          "explore",
          "share",
          "vibe",
          "purse",
        ]) {
          await page.goto(`/${locale}/${destination}`);
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          expect(await page.evaluate(() => innerWidth)).toBe(width);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
          const controls = await page
            .locator("button:not(#next-logo), .nav-destination")
            .evaluateAll((nodes) =>
              nodes
                .filter((n) => n.getClientRects().length)
                .map((n) => ({
                  label: n.textContent,
                  height: n.getBoundingClientRect().height,
                  width: n.getBoundingClientRect().width,
                  clipped:
                    n.scrollWidth > n.clientWidth + 1 ||
                    n.scrollHeight > n.clientHeight + 1,
                })),
            );
          for (const control of controls) {
            expect(
              control.height,
              control.label ?? "control",
            ).toBeGreaterThanOrEqual(43.9);
            expect(
              control.width,
              control.label ?? "control",
            ).toBeGreaterThanOrEqual(43.9);
            expect(control.clipped, control.label ?? "control").toBe(false);
          }
          if (destination === "home") {
            const actions = await page
              .locator(".hunt-actions button")
              .evaluateAll((nodes) =>
                nodes.map((n) => {
                  const label = n.querySelector(".action-label") ?? n;
                  const range = document.createRange();
                  range.selectNodeContents(label);
                  return {
                    height: n.getBoundingClientRect().height,
                    lines: new Set(
                      [...range.getClientRects()]
                        .filter((r) => r.width > 0)
                        .map((r) => Math.round(r.top)),
                    ).size,
                  };
                }),
              );
            expect(
              Math.abs(actions[0].height - actions[1].height),
            ).toBeLessThan(1);
            for (const action of actions) expect(action.lines).toBe(1);
          }
          if (destination === "share") {
            const cards = await page
              .locator(".share-camera-tile")
              .evaluateAll((nodes) =>
                nodes.map((n) => {
                  const box = n.getBoundingClientRect();
                  return {
                    width: box.width,
                    height: box.height,
                    top: box.top,
                    clipped:
                      n.scrollWidth > n.clientWidth + 1 ||
                      n.scrollHeight > n.clientHeight + 1,
                  };
                }),
              );
            expect(cards).toHaveLength(3);
            for (const card of cards) {
              expect(card.width).toBeGreaterThanOrEqual(43.9);
              expect(card.clipped).toBe(false);
            }
            expect(
              Math.max(...cards.map((c) => c.top)) -
                Math.min(...cards.map((c) => c.top)),
            ).toBeLessThan(1);
            expect(
              Math.max(...cards.map((c) => c.width)) -
                Math.min(...cards.map((c) => c.width)),
            ).toBeLessThan(1);
            expect(
              Math.max(...cards.map((c) => c.height)) -
                Math.min(...cards.map((c) => c.height)),
            ).toBeLessThan(1);
          }
          await page.locator("[data-page-end]").scrollIntoViewIfNeeded();
          const clearance = await page.evaluate(() => {
            const end = document
              .querySelector("[data-page-end]")!
              .getBoundingClientRect();
            const nav = document.querySelector(".bottom-nav")!;
            const style = getComputedStyle(nav);
            return innerHeight - end.bottom >= parseFloat(style.height) - 1;
          });
          expect(clearance).toBe(true);
        }
      });
    }
  }
}

for (const locale of locales) {
  test(`${locale}: short phone dialogs, forms and tab interactions`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto(`/${locale}/share`);
    for (const feature of ["shot", "check", "flash"]) {
      const trigger = page.locator(
        `.share-camera-tile[data-feature="${feature}"]`,
      );
      await trigger.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const dialog = await page.getByRole("dialog").boundingBox();
      expect(dialog!.x).toBeGreaterThanOrEqual(0);
      expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(320);
      expect(dialog!.height).toBeLessThanOrEqual(480);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await page.locator(".account").click();
    const menu = page.locator(".profile-menu");
    await expect(menu).toBeVisible();
    await menu.locator(".account-modes button").last().click();
    await expect(menu.locator('input[type="email"]')).toBeVisible();
    await expect(menu.locator('input[type="password"]')).toBeVisible();
    for (const input of await menu.locator("input").all()) {
      expect(
        await input.evaluate((n) => parseFloat(getComputedStyle(n).fontSize)),
      ).toBeGreaterThanOrEqual(16);
      const box = await input.boundingBox();
      expect(box!.width).toBeGreaterThan(200);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator(".account")).toBeFocused();
    await page.goto(`/${locale}/vibe`);
    for (const tab of ["gossip", "drift", "vibes", "orbit", "echo", "pulls"]) {
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
    await page.goto(`/${locale}/home`);
    for (const selector of [".activity-tabs", ".event-tabs"]) {
      await page.locator(`${selector} button`).last().click();
      await expect(page.locator(`${selector} button`).last()).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
  });
}
