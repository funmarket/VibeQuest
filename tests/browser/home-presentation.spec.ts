import { test, expect } from "@playwright/test";
import type { Activity, OfficialEvent } from "@vq/contracts";

// Explicit transport fixtures isolate presentation. These do not establish
// persistence, authorization, deployment or physical-device acceptance.
test.beforeEach(async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" }),
  );
});

for (const locale of ["en", "fr", "es", "ar"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme}: Home gathering presentation fixtures retain compact cards, details and authorized guest state`, async ({
      page,
    }) => {
      const ownerId = "10000000-0000-4000-8000-000000000001";
      const activity: Activity = {
        id: "10000000-0000-4000-8000-000000000002",
        ownerId,
        title: "Presentation fixture: coffee gathering",
        description: "Explicit fixture description",
        location: "Fixture location",
        emoji: "☕",
        startsAt: null,
        mediaIds: [],
        author: "Fixture author",
        status: "live",
        version: 1,
        createdAt: "2026-10-28T12:00:00.000Z",
        saved: false,
        reviewCount: 0,
        rating: 0,
      };
      const event: OfficialEvent = {
        id: "10000000-0000-4000-8000-000000000003",
        ownerId,
        businessId: "10000000-0000-4000-8000-000000000004",
        title: "Presentation fixture: live music",
        description: "Explicit event fixture description",
        location: "Fixture venue",
        tag: "music",
        startsAt: null,
        mediaIds: [],
        hostName: "Fixture host",
        status: "live",
        version: 1,
        createdAt: "2026-10-28T12:00:00.000Z",
        going: false,
        saved: false,
        rsvpCount: 0,
        reviewCount: 0,
        rating: 0,
      };
      await page.route("**/api/v1/**", async (route) => {
        const url = new URL(route.request().url());
        const body =
          url.pathname === "/api/v1/activities"
            ? { activities: [activity], nextOffset: null }
            : url.pathname === "/api/v1/events"
              ? { events: [event], nextOffset: null }
              : url.pathname.endsWith("/reviews")
                ? { reviews: [], nextOffset: null }
                : url.pathname === "/api/v1/identity/me"
                  ? { account: null }
                  : { error: { code: "AUTH_REQUIRED" } };
        await route.fulfill({ json: body });
      });
      await page.addInitScript(
        (value) => localStorage.setItem("vq.theme", value),
        theme,
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/home`);
      const activityCard = page.locator(".activity-card");
      const eventCard = page.locator(".event-card");
      await expect(activityCard).toHaveCount(1);
      await expect(eventCard).toHaveCount(1);
      await expect(eventCard.locator(".event-status")).toBeVisible();
      await expect(eventCard.locator(".event-expand-tray")).toHaveCSS(
        "border-radius",
        "50%",
      );
      if (theme === "light")
        await expect(eventCard.locator(".event-summary-rating")).toHaveCSS(
          "color",
          "rgb(128, 92, 0)",
        );
      for (const card of [activityCard, eventCard]) {
        const radius = await card.evaluate(
          (node) => getComputedStyle(node).borderRadius,
        );
        expect(radius).toBe(card === eventCard ? "16px" : "12px");
        await card.locator("button[aria-expanded]").click();
        await expect(card.locator("button[aria-expanded]")).toHaveAttribute(
          "aria-expanded",
          "true",
        );
      }
      await expect(activityCard).toContainText(activity.description);
      await expect(activityCard).toContainText(activity.author);
      await expect(eventCard).toContainText(event.description);
      await expect(eventCard).toContainText(event.hostName);
      await expect(eventCard.locator(".event-actions button")).toHaveCount(0);
      await expect(
        activityCard.locator("a[target=_blank]").first(),
      ).toHaveAttribute("href", /google.com\/maps/);
      await expect(
        eventCard.locator("a[target=_blank]").first(),
      ).toHaveAttribute("href", /google.com\/maps/);
      for (const width of [320, 360, 375, 390, 393, 412, 430, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.setViewportSize({ width: 390, height: 1000 });
      await eventCard.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `.local/home-gatherings-${locale}-${theme}.png`,
      });
    });
  }
}

for (const locale of ["en", "fr", "es", "ar"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme}: Home order, balanced flat tabs and keyboard selection`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("vq.theme", value),
        theme,
      );
      await page.goto(`/${locale}/home`);
      for (const width of [320, 360, 375, 390, 393, 412, 430, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const order = await page
          .locator(".home-grid > section")
          .evaluateAll((nodes) =>
            nodes.slice(0, 5).map((node) => node.className),
          );
        expect(order).toEqual([
          "checkins-panel",
          "home-flash-panel",
          "panel feed-panel",
          "activities-panel",
          "events-panel",
        ]);
        const rail = page.locator(".feed-panel [role=tablist]");
        const tabs = rail.getByRole("tab");
        await expect(tabs).toHaveCount(3);
        const geometry = await rail.evaluate((element) => ({
          scrolls: element.scrollWidth > element.clientWidth,
          boxes: Array.from(element.children).map((child) => {
            const rect = child.getBoundingClientRect();
            const style = getComputedStyle(child);
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              background: style.backgroundColor,
              radius: style.borderRadius,
            };
          }),
        }));
        expect(geometry.scrolls).toBe(false);
        expect(new Set(geometry.boxes.map((box) => box.y)).size).toBe(1);
        expect(
          Math.max(...geometry.boxes.map((box) => box.width)) -
            Math.min(...geometry.boxes.map((box) => box.width)),
        ).toBeLessThan(1);
        for (const box of geometry.boxes) {
          expect(box.background).toBe("rgba(0, 0, 0, 0)");
          expect(box.radius).toBe("0px");
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      const tabs = page.locator(".feed-panel").getByRole("tab");
      await tabs.nth(0).click();
      await tabs.nth(0).focus();
      await page.keyboard.press(locale === "ar" ? "ArrowLeft" : "ArrowRight");
      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      const active = await tabs.nth(1).evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          border: style.borderBottomWidth,
          borderColor: style.borderBottomColor,
        };
      });
      expect(active).toEqual({
        color: theme === "light" ? "rgb(138, 101, 0)" : "rgb(234, 179, 8)",
        border: "2px",
        borderColor: "rgb(234, 179, 8)",
      });
      await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
    });
  }
}
