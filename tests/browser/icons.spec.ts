import { test, expect } from "@playwright/test";
import { setTheme } from "./profile-controls";

// Five genuine page journeys plus screenshots; no intercepted API or SDK.
test.setTimeout(90_000);

const destinations = ["home", "explore", "share", "vibe", "purse"];
const colors = [
  "rgb(0, 206, 209)",
  "rgb(0, 255, 0)",
  "rgb(255, 0, 64)",
  "rgb(157, 0, 255)",
  "rgb(212, 175, 55)",
];

for (const locale of ["en", "ar"]) {
  for (const width of [390, 393, 412, 430, 820, 1280]) {
    for (const theme of ["light", "dark"]) {
      test(`${locale} ${theme} ${width}: shared icon roles and real actions`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/home`);
        await setTheme(page, theme);
        for (const destination of destinations) {
          await page.locator(`.nav-${destination}`).click();
          await expect(page).toHaveURL(
            new RegExp(`/${locale}/${destination}$`),
          );
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          const nav = page.locator(".bottom-nav");
          await expect(nav.locator("svg")).toHaveCount(5);
          for (const icon of await nav.locator("svg").all()) {
            await expect(icon).toHaveCSS("width", "24px");
            await expect(icon).toHaveCSS("height", "24px");
            await expect(icon).toHaveCSS("stroke-width", "2px");
            await expect(icon).toHaveCSS("fill", "none");
            await expect(icon).toHaveAttribute("aria-hidden", "true");
            const box = await icon.boundingBox();
            const bar = await nav.boundingBox();
            expect(box!.y).toBeGreaterThanOrEqual(bar!.y);
            expect(box!.y + box!.height).toBeLessThanOrEqual(
              bar!.y + bar!.height,
            );
          }
          await expect(nav.locator(".nav-purse .lucide-wallet")).toHaveCount(1);
          const contrasts = await nav.locator("a").evaluateAll((links) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d")!;
            function sample(color: string, background = "white") {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = background;
              context.fillRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
              const channels = [r!, g!, b!].map((value) => {
                const s = value / 255;
                return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
              });
              return (
                channels[0]! * 0.2126 +
                channels[1]! * 0.7152 +
                channels[2]! * 0.0722
              );
            }
            function ratio(a: number, b: number) {
              return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            }
            return links.map((link) => {
              const style = getComputedStyle(link);
              const background = getComputedStyle(
                link.closest("nav")!,
              ).backgroundColor;
              const body = getComputedStyle(document.body).backgroundColor;
              context.fillStyle = body;
              context.fillRect(0, 0, 1, 1);
              context.fillStyle = background;
              context.fillRect(0, 0, 1, 1);
              context.fillStyle = style.backgroundColor;
              context.fillRect(0, 0, 1, 1);
              const pixels = context.getImageData(0, 0, 1, 1).data;
              const surface = `rgb(${pixels[0]}, ${pixels[1]}, ${pixels[2]})`;
              const surfaceLuminance = sample(surface);
              return {
                text: ratio(sample(style.color, surface), surfaceLuminance),
                icon: ratio(
                  sample(
                    getComputedStyle(link.querySelector("svg")!).color,
                    surface,
                  ),
                  surfaceLuminance,
                ),
              };
            });
          });
          for (const contrast of contrasts) {
            expect(contrast.text).toBeGreaterThanOrEqual(4.5);
            expect(contrast.icon).toBeGreaterThanOrEqual(3);
          }
          const identities = await page.evaluate(() => {
            const swatch = document.createElement("span");
            document.body.append(swatch);
            const values = ["home", "explore", "share", "vibe", "purse"].map(
              (id) => {
                swatch.style.color = `var(--identity-${id})`;
                return getComputedStyle(swatch).color;
              },
            );
            swatch.remove();
            return values;
          });
          expect(identities).toEqual(colors);
          const identityIcons = await page
            .locator('svg[data-icon-tone="identity"]')
            .evaluateAll((elements) =>
              elements.map((el) => {
                const scope = el.closest(".app-shell")!;
                const swatch = document.createElement("span");
                swatch.style.color = "var(--icon-accent)";
                scope.append(swatch);
                const expected = getComputedStyle(swatch).color;
                swatch.remove();
                return { actual: getComputedStyle(el).color, expected };
              }),
            );
          for (const icon of identityIcons)
            expect(icon.actual).toBe(icon.expected);
          const icons = await page
            .locator("main svg.lucide")
            .evaluateAll((elements) =>
              elements.map((el) => ({
                role: el.getAttribute("data-icon-role"),
                size: getComputedStyle(el).width,
                fill: getComputedStyle(el).fill,
                fillState: el.getAttribute("data-icon-fill"),
                stroke: getComputedStyle(el).stroke,
                color: getComputedStyle(el).color,
                round: getComputedStyle(el).strokeLinejoin,
                weight: getComputedStyle(el).strokeWidth,
                stableStroke: Array.from(el.children).every(
                  (child) =>
                    getComputedStyle(child).vectorEffect ===
                    "non-scaling-stroke",
                ),
              })),
            );
          expect(icons.length).toBeGreaterThan(0);
          for (const icon of icons) {
            expect(["metadata", "action", "feature", "illustration"]).toContain(
              icon.role,
            );
            expect(icon.size).toBe(
              (
                {
                  metadata: "16px",
                  action: "20px",
                  feature: "32px",
                  illustration: "44px",
                } as Record<string, string>
              )[icon.role!],
            );
            expect(icon.round).toBe("round");
            expect(icon.weight).toBe(
              (
                {
                  metadata: "1.75px",
                  action: "2px",
                  feature: "2.25px",
                  illustration: "2.5px",
                } as Record<string, string>
              )[icon.role!],
            );
            expect(icon.stableStroke).toBe(true);
            expect(icon.stroke).toBe(icon.color);
            expect(icon.fill).toBe(
              icon.fillState === "solid" ? icon.color : "none",
            );
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
          ).toBe(false);
          await page.locator(".account").click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(
            page.locator(".profile-menu .icon-button svg"),
          ).toHaveCSS("width", "20px");
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await expect(page.locator(".account")).toBeFocused();
          if (width === 390)
            await page.screenshot({
              path: info.outputPath(`${destination}.png`),
              fullPage: true,
            });
        }
      });
    }
  }
}

test("system theme follows the actual browser media query; enlarged text keeps navigation reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/en/home");
  await setTheme(page, "system");
  for (const scheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
    await expect(page.locator(".nav-home svg")).toHaveCSS("width", "24px");
  }
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.locator(".nav-share").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/share$/);
  await expect(page.locator(".nav-share")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("reference glyph details and shared notice actions remain accessible", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/en/share");
  await setTheme(page, "dark");
  await expect(page.locator('.nav-home svg path[d="M19 4v4"]')).toHaveCount(1);
  await expect(page.locator('.nav-purse svg path[d="M18 14h.01"]')).toHaveCount(
    1,
  );
  const capture = page.locator(".capture-panel .soft-button");
  await capture.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-icon-role="metadata"]')).toHaveCSS(
    "width",
    "16px",
  );
  await expect(dialog.locator('[data-icon-role="action"]')).toHaveCSS(
    "width",
    "20px",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(capture).toBeFocused();
  await page
    .locator(".bottom-nav")
    .screenshot({ path: info.outputPath("reference-navbar.png") });
});
