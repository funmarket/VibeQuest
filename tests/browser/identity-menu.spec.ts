import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createDatabase } from "../../packages/database/src/index";
import { openPreferences, setLocale } from "./profile-controls";

test("guest preferences and real account lifecycle use the canonical profile menu", async ({
  page,
}) => {
  test.setTimeout(120000);
  const database = createDatabase(
    "postgresql://vq_local@127.0.0.1:55439/vq_foundation",
  );
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
  } finally {
    await database.pool.query(
      "DELETE FROM identity_users WHERE id IN (SELECT user_id FROM identity_password_accounts WHERE email=$1)",
      [email],
    );
    await database.close();
  }
});

for (const locale of ["en", "fr", "ar", "es"]) {
  for (const width of [320, 768]) {
    test(`guest profile preferences ${locale} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${locale}/home`);
      await expect(page.locator(".app-header select")).toHaveCount(0);
      await openPreferences(page);
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
