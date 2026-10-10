import { randomUUID } from "node:crypto";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { createDatabase } from "../../packages/database/src/index";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
test.skip(
  ({ baseURL }) => baseURL !== "http://127.0.0.1:3003",
  "Requires isolated real Social API/database configuration.",
);
test("real Orbit/Echo, public basic profiles and private Media across sessions", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const origin = "http://127.0.0.1:3003";
  const db = createDatabase("postgresql://vq_local@127.0.0.1:55439/vq_test");
  const emails = [
    `orbit-${randomUUID()}@example.test`,
    `echo-${randomUUID()}@example.test`,
  ];
  const handles = [
    `orbit_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    `echo_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
  ];
  const password = "Actual-social-browser!95";
  const ids: string[] = [];
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const guests = await browser.newContext();
  const guest = await guests.newPage();
  async function login(target: Page, email: string) {
    await target.goto("/en/vibe");
    await target
      .getByRole("button", { name: "Your VibeQuest account" })
      .click();
    const menu = target.getByRole("dialog");
    await menu.getByLabel("Email", { exact: true }).fill(email);
    await menu.getByLabel("Password", { exact: true }).fill(password);
    await menu.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await target.keyboard.press("Escape");
  }
  try {
    for (let i = 0; i < 2; i++) {
      const account = await page.request.post(
        `${origin}/api/v1/identity/register`,
        { headers: { origin }, data: { email: emails[i], password } },
      );
      expect(account.status()).toBe(201);
      ids.push((await account.json()).account.id);
      expect(
        (
          await page.request.put(`${origin}/api/v1/profile/me`, {
            headers: { origin },
            data: {
              name: i ? "Echo Voyager" : "Orbit Voyager",
              bio: `Actual social biography ${i}`,
              handle: handles[i],
              favoriteVibe: "Cozy",
              version: 0,
            },
          })
        ).status(),
      ).toBe(200);
    }
    const photoIntent = await page.request.post(
      `${origin}/api/v1/media/uploads`,
      { headers: { origin }, data: { visibility: "private" } },
    );
    expect(photoIntent.status()).toBe(201);
    const photoId = (await photoIntent.json()).media.id;
    expect(
      (
        await page.request.put(`${origin}/api/v1/media/uploads/${photoId}`, {
          headers: { origin, "Content-Type": "image/png" },
          data: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
            "base64",
          ),
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.put(`${origin}/api/v1/profile/photo`, {
          headers: { origin },
          data: { mediaId: photoId, version: 1 },
        })
      ).status(),
    ).toBe(200);
    await page.request.post(`${origin}/api/v1/identity/logout`, {
      headers: { origin },
    });
    await login(page, emails[0]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    await page.getByText("Appearance", { exact: true }).click();
    await page
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption("dark");
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "ORBIT", exact: true }).click();
    await expect(
      page.getByText("You follow 0 people", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Public username / handle", { exact: true })
      .fill(handles[1]);
    await page
      .getByRole("button", { name: "Open profile", exact: true })
      .click();
    const publicProfile = page.locator(".social-public");
    await expect(
      publicProfile.getByRole("heading", { name: "Echo Voyager", exact: true }),
    ).toBeVisible();
    expect(await publicProfile.locator("img").count()).toBe(0);
    await publicProfile
      .getByRole("button", { name: "Follow", exact: true })
      .click();
    await expect(
      publicProfile.getByRole("button", { name: "Unfollow", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await publicProfile
      .getByRole("link", { name: "Back to Vibe", exact: true })
      .click();
    await page.getByRole("tab", { name: "ORBIT", exact: true }).click();
    const orbit = page
      .locator(".social-row")
      .filter({ hasText: `@${handles[1]}` });
    await expect(orbit).toBeVisible();
    await expect(
      orbit.getByText("Actual social biography 1", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "ORBIT", exact: true }).click();
    await expect(orbit).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page
      .locator(".social-view")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    const rowBounds = await orbit.boundingBox();
    const navigationBounds = await page.locator(".bottom-nav").boundingBox();
    expect(rowBounds).not.toBeNull();
    expect(navigationBounds).not.toBeNull();
    expect(rowBounds!.y + rowBounds!.height).toBeLessThan(navigationBounds!.y);
    await page
      .locator(".social-view")
      .screenshot({ path: ".local/reconstruction/orbit-dark.png" });
    await login(pageB, emails[1]);
    await pageB.getByRole("tab", { name: "ECHO", exact: true }).click();
    const echo = pageB
      .locator(".social-row")
      .filter({ hasText: `@${handles[0]}` });
    await expect(echo).toBeVisible();
    await expect(
      echo.getByRole("button", { name: "Follow Back", exact: true }),
    ).toBeVisible();
    await echo
      .getByRole("button", { name: "Follow Back", exact: true })
      .click();
    await expect(
      echo.getByText("You follow each other", { exact: true }),
    ).toBeVisible();
    await pageB.reload();
    await pageB.getByRole("tab", { name: "ECHO", exact: true }).click();
    await expect(
      echo.getByText("You follow each other", { exact: true }),
    ).toBeVisible();
    await expect(echo.getByRole("link")).toHaveAttribute(
      "href",
      `/en/people/${handles[0]}`,
    );
    await guest.goto(`${origin}/en/people/${handles[1]}`);
    await expect(
      guest
        .locator(".social-public")
        .getByText("Actual social biography 1", { exact: true }),
    ).toBeVisible();
    expect(await guest.locator(".social-public img").count()).toBe(0);
    const projection = await guest.request.get(
      `${origin}/api/v1/public-profiles/handle/${handles[1]}`,
    );
    expect(Object.keys((await projection.json()).profile).sort()).toEqual([
      "bio",
      "handle",
      "id",
      "name",
    ]);
    expect(
      (
        await guest.request.get(`${origin}/api/v1/media/${photoId}/thumbnail`)
      ).status(),
    ).toBe(404);
    expect(
      (
        await page.request.get(`${origin}/api/v1/media/${photoId}/thumbnail`)
      ).status(),
    ).toBe(404);
    expect(
      (
        await pageB.request.get(`${origin}/api/v1/media/${photoId}/thumbnail`)
      ).status(),
    ).toBe(200);
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    await page.getByText("Appearance", { exact: true }).click();
    await page
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption("light");
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(
      await page
        .locator(".social-view")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
    await page
      .locator(".social-view")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page
      .locator(".social-view")
      .screenshot({ path: ".local/reconstruction/orbit-light.png" });
    await orbit.getByRole("button", { name: "Unfollow", exact: true }).click();
    await expect(orbit).toHaveCount(0);
    await expect(
      page.getByText("You follow 0 people", { exact: true }),
    ).toBeVisible();
    await pageB.reload();
    await pageB.getByRole("tab", { name: "ECHO", exact: true }).click();
    await expect(echo).toHaveCount(0);
    await expect(
      pageB.getByText("No followers yet", { exact: true }),
    ).toBeVisible();
    for (const name of ["GOSSIP", "DRIFT", "VIBES", "ORBIT", "ECHO", "Pulls"]) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect(
        page.getByRole("tab", { name, exact: true }),
      ).toHaveAttribute("aria-selected", "true");
    }
    expect(await page.getByRole("tab").count()).toBe(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(
      (
        await db.pool.query(
          "SELECT * FROM social_follows WHERE follower_id=$1 AND followed_id=$2",
          [ids[0], ids[1]],
        )
      ).rowCount,
    ).toBe(0);
  } finally {
    const users = (
      await db.pool.query(
        "SELECT user_id FROM identity_password_accounts WHERE email=ANY($1::text[])",
        [emails],
      )
    ).rows.map((row) => row.user_id);
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users,
    ]);
    const media = createMedia(
      db.media,
      createLocalMediaStorage(path.resolve(".local/social-browser-media")),
      imageProcessor,
    );
    for (const row of (
      await db.pool.query(
        "SELECT object_id,owner_id FROM media_cleanup_jobs WHERE owner_id=ANY($1::uuid[]) AND completed_at IS NULL",
        [users],
      )
    ).rows)
      await media.remove(row.owner_id, row.object_id);
    await contextB.close();
    await guests.close();
    await db.close();
  }
});
