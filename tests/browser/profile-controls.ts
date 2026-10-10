import type { Page } from "@playwright/test";

export async function openPreferences(
  page: Page,
  section: "appearance" | "language" = "appearance",
) {
  const menu = page.locator(".profile-menu");
  if (!(await menu.isVisible())) await page.locator(".account").click();
  const detail = menu
    .locator("details details")
    .nth(section === "appearance" ? 0 : 1);
  if ((await detail.getAttribute("open")) === null)
    await detail.locator("summary").click();
}
export async function setTheme(page: Page, value: string) {
  await openPreferences(page);
  await page.locator(".profile-menu select").first().selectOption(value);
  await page.locator(".profile-menu .icon-button").click();
}
export async function setLocale(page: Page, value: string) {
  await openPreferences(page, "language");
  await page.locator(".profile-menu select").nth(1).selectOption(value);
  await page.keyboard.press("Escape");
}
