import { randomUUID } from "node:crypto";
import {
  test,
  expect,
  request,
  type APIRequestContext,
  type Browser,
} from "@playwright/test";
import { browserDatabase } from "./browser-database";
import { setTheme } from "./profile-controls";
const origin = "http://127.0.0.1:3000",
  headers = { origin };
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
  "base64",
);
let author: APIRequestContext,
  viewer: APIRequestContext,
  authorId = "",
  viewerId = "",
  postId = "",
  mediaId = "",
  handle = "";
const postIds: string[] = [];
let db: ReturnType<typeof browserDatabase>;
test.describe.configure({ mode: "serial" });
test.beforeAll(async () => {
  db = browserDatabase();
  author = await request.newContext({ baseURL: origin });
  viewer = await request.newContext({ baseURL: origin });
  for (const [api, kind] of [
    [author, "author"],
    [viewer, "viewer"],
  ] as const) {
    const r = await api.post("/api/v1/identity/register", {
      headers,
      data: {
        email: `r08-${kind}-${randomUUID()}@example.test`,
        password: "R08-network-browser!99",
      },
    });
    expect(r.status()).toBe(201);
    const id = (await r.json()).account.id;
    if (kind === "author") authorId = id;
    else viewerId = id;
  }
  expect(
    (
      await viewer.put("/api/v1/profile/me", {
        headers,
        data: {
          name: "Home Source Viewer",
          bio: "Actual comment author",
          handle: "viewer_" + randomUUID().replaceAll("-", "").slice(0, 12),
          favoriteVibe: "Cozy",
          version: 0,
        },
      })
    ).status(),
  ).toBe(200);
  handle = `home_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  expect(
    (
      await author.put("/api/v1/profile/me", {
        headers,
        data: {
          name: "Home Source Author",
          bio: "An actual public biography",
          handle,
          favoriteVibe: "Cozy",
          version: 0,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await viewer.put(`/api/v1/social/users/${authorId}/follow`, {
        headers,
        data: { following: true },
      })
    ).status(),
  ).toBe(200);
  for (let i = 0; i < 22; i++) {
    const r = await author.post("/api/v1/content/me/posts", {
      headers,
      data: {
        text: `R08 chronological fixture ${i}`,
        locationLabel: "",
        audience: "PUBLIC",
      },
    });
    expect(r.status()).toBe(201);
    postIds.push((await r.json()).post.id);
  }
  // Equal timestamps test the existing timestamp/UUID cursor through the Home UI.
  await db.pool.query(
    "UPDATE content_posts SET created_at='2026-10-25T00:00:00.123456Z' WHERE id=ANY($1::uuid[])",
    [postIds],
  );
  const intent = await author.post("/api/v1/media/uploads", {
    headers,
    data: { visibility: "content" },
  });
  expect(intent.status()).toBe(201);
  mediaId = (await intent.json()).media.id;
  expect(
    (
      await author.put(`/api/v1/media/uploads/${mediaId}`, {
        headers: { ...headers, "content-type": "image/png" },
        data: png,
      })
    ).status(),
  ).toBe(200);
  const p = await author.post("/api/v1/content/me/posts", {
    headers,
    data: {
      text: "R08 actual image and interaction post",
      locationLabel: "Chosen place label",
      audience: "PUBLIC",
      mediaId,
      emoji: "☕",
    },
  });
  expect(p.status()).toBe(201);
  postId = (await p.json()).post.id;
  postIds.push(postId);
});
test.afterAll(async () => {
  if (!db) return;
  try {
    await db.pool.query("DELETE FROM content_posts WHERE author_id=$1", [
      authorId,
    ]);
    if (mediaId && author)
      expect(
        (await author.delete(`/api/v1/media/${mediaId}`, { headers })).status(),
      ).toBe(204);
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      [authorId, viewerId].filter(Boolean),
    ]);
  } finally {
    await author?.dispose();
    await viewer?.dispose();
    await db.close();
  }
});
async function session(browser: Browser, api?: APIRequestContext) {
  return browser.newContext({
    baseURL: origin,
    storageState: api ? await api.storageState() : undefined,
    viewport: { width: 390, height: 844 },
  });
}
async function editAudience(audience: string) {
  const p = (
    await (await author.get(`/api/v1/content/me/posts/${postId}`)).json()
  ).post;
  expect(
    (
      await author.put(`/api/v1/content/me/posts/${postId}`, {
        headers,
        data: {
          text: p.text,
          locationLabel: p.locationLabel,
          audience,
          mediaId,
          emoji: p.emoji,
          version: p.version,
        },
      })
    ).status(),
  ).toBe(200);
}
test("R08 real Home feed, tied pagination, likes/comments/failures, copy and deep-link return", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const context = await session(browser, viewer);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto("/en/home#home-feed");
    const feed = page.locator(".home-network"),
      card = page.locator(`[data-post-id="${postId}"]`);
    await expect(card).toBeVisible();
    await expect(
      card.getByText("Home Source Author", { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText("Chosen place label", { exact: false }),
    ).toBeVisible();
    await expect
      .poll(() =>
        card
          .locator("img")
          .evaluate((el) => (el as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(await card.locator("time").getAttribute("datetime")).toBe(
      (await (await viewer.get(`/api/v1/content/posts/${postId}`)).json()).post
        .createdAt,
    );
    await expect(feed.locator(".network-post")).toHaveCount(20);
    await feed.getByRole("button", { name: "Load more", exact: true }).click();
    await expect(feed.locator(".network-post")).toHaveCount(23);
    const rendered = await feed
      .locator(".network-post")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-post-id")));
    expect(new Set(rendered).size).toBe(23);
    const actual = (
      await db.pool.query(
        "SELECT id FROM content_posts WHERE author_id=$1 ORDER BY created_at DESC,id DESC",
        [authorId],
      )
    ).rows.map((r) => r.id);
    expect(rendered).toEqual(actual);
    for (const selected of [true, false, true]) {
      await card
        .getByRole("button", {
          name: selected ? "Like" : "Unlike",
          exact: true,
        })
        .click();
      await expect(
        card.getByRole("button", {
          name: selected ? "Unlike" : "Like",
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", String(selected));
    }
    await page.reload();
    await expect(
      card.getByRole("button", { name: "Unlike", exact: true }),
    ).toContainText("1");
    await page.route(`**/content/posts/${postId}/reaction`, (route) =>
      route.fulfill({ status: 503, json: { code: "CONTENT_UNAVAILABLE" } }),
    );
    await card.getByRole("button", { name: "Unlike", exact: true }).click();
    await expect(card.getByRole("alert")).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Unlike", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.unroute(`**/content/posts/${postId}/reaction`);
    await card.getByRole("button", { name: "Comments", exact: true }).click();
    const input = card.getByLabel("Comment", { exact: true }),
      send = card.getByRole("button", { name: "Send", exact: true });
    await input.fill("   ");
    await expect(send).toBeDisabled();
    const comment = `R08 persisted comment ${randomUUID()}`;
    await input.fill(comment);
    await page.route(`**/content/posts/${postId}/comments`, (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 503, json: { code: "CONTENT_UNAVAILABLE" } })
        : route.continue(),
    );
    await send.click();
    await expect(input).toHaveValue(comment);
    await expect(card.getByRole("alert")).toBeVisible();
    await page.unroute(`**/content/posts/${postId}/comments`);
    let writes = 0;
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        r.url().endsWith(`/content/posts/${postId}/comments`)
      )
        writes++;
    });
    await send.evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
    await expect(
      card.locator(".network-comment").filter({ hasText: comment }),
    ).toHaveCount(1);
    expect(writes).toBe(1);
    await expect(
      card
        .locator(".network-comment")
        .filter({ hasText: comment })
        .getByText("Home Source Viewer", { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Comments", exact: true }),
    ).toContainText("1");
    await page.reload();
    await card.getByRole("button", { name: "Comments", exact: true }).click();
    await expect(card.getByText(comment, { exact: true })).toBeVisible();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await card.getByRole("button", { name: "Share", exact: true }).click();
    await expect(card.getByRole("status")).toHaveText("Post link copied.");
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toBe(`${origin}/en/home?post=${postId}#home-feed`);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new DOMException("denied", "NotAllowedError");
          },
        },
      }),
    );
    await card.getByRole("button", { name: "Share", exact: true }).click();
    await expect(
      card.getByText("The link could not be copied.", { exact: false }),
    ).toBeVisible();
    await expect(
      card.getByText("Post link copied.", { exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      }),
    );
    await card.getByRole("button", { name: "Share", exact: true }).click();
    await expect(
      card.getByText("The link could not be copied.", { exact: false }),
    ).toBeVisible();
    await card.getByRole("link", { name: "Open post" }).click();
    await expect(page).toHaveURL(new RegExp(`post=${postId}`));
    await expect(page.locator(".network-post")).toHaveCount(1);
    await page.getByRole("link", { name: "Back to My Network" }).click();
    await expect(page).toHaveURL(/\/en\/home#home-feed$/);
    await expect(card).toBeVisible();
    const homeScroll = await page.evaluate(() => window.scrollY);
    await card
      .getByRole("link", { name: "Home Source Author", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/people/${handle}`));
    await page.goBack();
    await expect(card).toBeVisible();
    await expect
      .poll(async () =>
        Math.abs((await page.evaluate(() => window.scrollY)) - homeScroll),
      )
      .toBeLessThan(100);
    await page.getByRole("tab", { name: "Local Vibes", exact: true }).click();
    await expect(page.locator(".network-post")).toHaveCount(0);
    await page.getByRole("tab", { name: "For You", exact: true }).click();
    await expect(page.locator(".network-post")).toHaveCount(0);
    await page.getByRole("tab", { name: "My Network", exact: true }).click();
    await expect(card).toBeVisible();
    await page.route("**/content/feed", (route) =>
      route.fulfill({ status: 503, json: { code: "CONTENT_UNAVAILABLE" } }),
    );
    await feed.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(feed.getByRole("alert")).toBeVisible();
    await expect(card).toHaveCount(0);
    await page.unroute("**/content/feed");
    await feed.getByRole("button", { name: "Reload", exact: true }).click();
    await expect(card).toBeVisible();
    await page.route("**/content/feed", async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await feed.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(feed.getByRole("status")).toHaveText("Loading…");
    await expect(card).toBeVisible();
    await page.unroute("**/content/feed");
  } finally {
    await context.close();
  }
});
test("R08 comment continuation survives submission beyond the first twenty comments", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const context = await session(browser, viewer),
    page = await context.newPage();
  try {
    for (let i = 0; i < 21; i++)
      expect(
        (
          await viewer.post("/api/v1/content/posts/" + postId + "/comments", {
            headers,
            data: { text: "Continuation comment " + i },
          })
        ).status(),
      ).toBe(201);
    await page.goto("/en/home?post=" + postId + "#home-feed");
    const card = page.locator(".network-post");
    await card.getByRole("button", { name: "Comments", exact: true }).click();
    const drawer = card.locator(".network-comments");
    await expect(drawer.locator(".network-comment")).toHaveCount(20);
    await drawer
      .getByRole("button", { name: "Load more", exact: true })
      .click();
    await expect(
      drawer.getByText("Continuation comment 20", { exact: true }),
    ).toBeVisible();
    const count = await drawer.locator(".network-comment").count();
    await drawer
      .getByLabel("Comment", { exact: true })
      .fill("Newest continuation submission");
    await drawer.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      drawer.getByText("Newest continuation submission", { exact: true }),
    ).toBeVisible();
    await expect(drawer.locator(".network-comment")).toHaveCount(count + 1);
  } finally {
    await context.close();
  }
});
test("R08 Home and shared links enforce current audience, follow, block, removal and scoped Media", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await session(browser, viewer),
    guests = await session(browser);
  const page = await context.newPage(),
    guest = await guests.newPage();
  page.setDefaultTimeout(10000);
  guest.setDefaultTimeout(10000);
  const path = `/en/home?post=${postId}#home-feed`,
    image = `/api/v1/media/${mediaId}/image?postId=${postId}`;
  const card = page.locator(`[data-post-id="${postId}"]`),
    gcard = guest.locator(`[data-post-id="${postId}"]`);
  try {
    await guest.goto(path);
    await expect(gcard).toBeVisible();
    await gcard.getByRole("button", { name: "Like", exact: true }).click();
    await expect(gcard.getByLabel("Email", { exact: true })).toBeVisible();
    expect(
      (
        await guests.request.put(`/api/v1/content/posts/${postId}/reaction`, {
          headers,
          data: { liked: true },
        })
      ).status(),
    ).toBe(401);
    await editAudience("FOLLOWERS_ONLY");
    await guest.reload();
    await expect(gcard).toHaveCount(0);
    await expect(
      guest.locator(".home-network").getByRole("alert"),
    ).toContainText("unavailable");
    expect((await guests.request.get(image)).status()).toBe(404);
    await page.goto(path);
    await expect(card).toBeVisible();
    expect((await viewer.get(image)).status()).toBe(200);
    expect(
      (
        await viewer.put(`/api/v1/social/users/${authorId}/follow`, {
          headers,
          data: { following: false },
        })
      ).status(),
    ).toBe(200);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".home-network")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(card).toHaveCount(0);
    expect((await viewer.get(image)).status()).toBe(404);
    expect(
      (
        await viewer.put(`/api/v1/social/users/${authorId}/follow`, {
          headers,
          data: { following: true },
        })
      ).status(),
    ).toBe(200);
    await page.reload();
    await expect(card).toBeVisible();
    expect(
      (
        await author.put(`/api/v1/social/users/${viewerId}/block`, {
          headers,
          data: { blocked: true },
        })
      ).status(),
    ).toBe(200);
    await page.reload();
    await expect(card).toHaveCount(0);
    expect((await viewer.get(image)).status()).toBe(404);
    expect(
      (
        await author.put(`/api/v1/social/users/${viewerId}/block`, {
          headers,
          data: { blocked: false },
        })
      ).status(),
    ).toBe(200);
    await editAudience("PUBLIC");
    await guest.reload();
    await expect(gcard).toBeVisible();
    expect((await guests.request.get(image)).status()).toBe(200);
    // No bare delivery URL, including the attachment owner.
    expect((await author.get(`/api/v1/media/${mediaId}/image`)).status()).toBe(
      404,
    );
    expect(
      (
        await viewer.put(`/api/v1/social/users/${authorId}/follow`, {
          headers,
          data: { following: true },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/en/home#home-feed");
    await expect(card).toBeVisible();
    await db.pool.query(
      "UPDATE content_posts SET hidden_at=clock_timestamp() WHERE id=$1",
      [postId],
    );
    await page
      .locator(".home-network")
      .getByRole("button", { name: "Refresh", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    expect((await viewer.get(image)).status()).toBe(404);
    await db.pool.query("UPDATE content_posts SET hidden_at=NULL WHERE id=$1", [
      postId,
    ]);
    const p = (
      await (await author.get(`/api/v1/content/me/posts/${postId}`)).json()
    ).post;
    expect(
      (
        await author.delete(`/api/v1/content/me/posts/${postId}`, {
          headers,
          data: { version: p.version },
        })
      ).status(),
    ).toBe(200);
    await page.reload();
    await expect(card).toHaveCount(0);
    expect((await viewer.get(image)).status()).toBe(404);
    const deleted = (
      await (await author.get(`/api/v1/content/me/posts?deleted=true`)).json()
    ).posts.find((p: { id: string }) => p.id === postId);
    await author.post(`/api/v1/content/me/posts/${postId}/restore`, {
      headers,
      data: { version: deleted.version },
    });
    // New viewer's own/followed network is truly empty after follow removal.
    expect(
      (
        await viewer.put(`/api/v1/social/users/${authorId}/follow`, {
          headers,
          data: { following: false },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/en/home#home-feed");
    await page
      .locator(".home-network")
      .getByRole("button", { name: "Refresh", exact: true })
      .click();
    await expect(page.locator(".home-network")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.locator(".home-network .network-post")).toHaveCount(0);
    await expect(page.locator(".home-network")).toContainText(
      "No posts to show.",
    );
    await guest.goto("/en/home?post=invalid#home-feed");
    await expect(
      guest.locator(".home-network").getByRole("alert"),
    ).toBeVisible();
    await expect(gcard).toHaveCount(0);
  } finally {
    await context.close();
    await guests.close();
  }
});
test("R08 Home card phone widths, four locales, two themes, RTL and inline keyboard controls", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const context = await session(browser, author),
    page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    for (const locale of ["en", "fr", "es", "ar"]) {
      await page.goto(`/${locale}/home?post=${postId}#home-feed`);
      await expect(page.locator(".network-post")).toBeVisible();
      for (const theme of ["light", "dark"]) {
        await setTheme(page, theme);
        await expect(page.locator(".network-post")).toBeVisible();
        for (const width of [320, 360, 375, 390, 412, 430]) {
          await page.setViewportSize({ width, height: 844 });
          const card = page.locator(".network-post");
          await card.scrollIntoViewIfNeeded();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          ).toBe(true);
          const controls = card.locator(".network-actions button");
          expect(await controls.count()).toBe(3);
          for (const button of await controls.all()) {
            const box = await button.boundingBox();
            expect(box!.width).toBeGreaterThanOrEqual(44);
            expect(box!.height).toBeGreaterThanOrEqual(44);
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          }
          if (width === 375)
            await card.screenshot({
              path: `.local/r08/home-${locale}-${theme}.png`,
            });
        }
      }
      expect(await page.locator("html").getAttribute("dir")).toBe(
        locale === "ar" ? "rtl" : "ltr",
      );
      const card = page.locator(".network-post");
      await card.locator(".network-actions button").nth(1).click();
      const input = card.locator("input");
      await input.fill("Keyboard draft");
      await input.focus();
      await page.keyboard.press("Tab");
      await expect(card.locator("form button")).toBeFocused();
      await expect(input).toHaveValue("Keyboard draft");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    await context.close();
  }
});
