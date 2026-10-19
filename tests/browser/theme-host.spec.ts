import { setTheme } from "./profile-controls";
import { test, expect } from "@playwright/test";

test("simulated Telegram capabilities update shared theme and safe areas without granting identity", async ({
  page,
}) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" }),
  );
  await page.addInitScript(() => {
    const listeners = new Map<string, Set<() => void>>();
    const backs = new Set<() => void>();
    const sdk = {
      initData: "simulated-launch-not-an-authentication-proof",
      colorScheme: "dark",
      safeAreaInset: { top: 20, bottom: 10 },
      contentSafeAreaInset: { top: 25, bottom: 4 },
      get initDataUnsafe() {
        throw new Error("Identity must not be read");
      },
      onEvent(event: string, fn: () => void) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(fn);
      },
      offEvent(event: string, fn: () => void) {
        listeners.get(event)?.delete(fn);
      },
      BackButton: {
        show() {},
        hide() {},
        onClick(fn: () => void) {
          backs.add(fn);
        },
        offClick(fn: () => void) {
          backs.delete(fn);
        },
      },
      HapticFeedback: { impactOccurred() {} },
    };
    Object.assign(window, {
      Telegram: { WebApp: sdk },
      hostFixture: {
        theme(scheme: string) {
          sdk.colorScheme = scheme;
          listeners.get("themeChanged")?.forEach((fn) => fn());
        },
        insets() {
          sdk.safeAreaInset = { top: 30, bottom: 22 };
          listeners.get("safeAreaChanged")?.forEach((fn) => fn());
        },
        backCount() {
          return backs.size;
        },
        back() {
          [...backs].forEach((fn) => fn());
        },
      },
    });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/telegram");
  await expect(page).toHaveURL("/en/home");
  const root = page.locator("html");
  const shell = page.locator("[data-host]");
  await expect(shell).toHaveAttribute("data-host", "telegram");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Switch to light theme", exact: true })
    .click();
  await expect(root).toHaveAttribute("data-theme", "light");
  await setTheme(page, "system");
  await expect(root).toHaveAttribute("data-theme", "dark");
  expect(
    await shell.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--host-safe-top").trim(),
    ),
  ).toBe("25px");
  await page.evaluate(() => {
    const fixture = (
      window as unknown as {
        hostFixture: { theme(s: string): void; insets(): void };
      }
    ).hostFixture;
    fixture.theme("light");
    fixture.insets();
  });
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "Switch to dark theme", exact: true }),
  ).toBeVisible();
  expect(
    await shell.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--host-safe-bottom").trim(),
    ),
  ).toBe("22px");
  await setTheme(page, "dark");
  await page.evaluate(() =>
    (
      window as unknown as { hostFixture: { theme(s: string): void } }
    ).hostFixture.theme("light"),
  );
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "VIBE", exact: true })
    .click();
  await expect(page).toHaveURL("/en/vibe");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { hostFixture: { backCount(): number } }
        ).hostFixture.backCount(),
      ),
    )
    .toBe(1);
  await page.evaluate(() =>
    (window as unknown as { hostFixture: { back(): void } }).hostFixture.back(),
  );
  await expect(page).toHaveURL("/en/home");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { hostFixture: { backCount(): number } }
        ).hostFixture.backCount(),
      ),
    )
    .toBe(0);
});

test("blocked preference storage keeps theme selection usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage denied");
      },
    }),
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/home");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await setTheme(page, "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
