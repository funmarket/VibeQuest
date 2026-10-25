import { afterEach, expect, it, vi } from "vitest";
import {
  createOwnTextPost,
  editOwnTextPost,
  restoreOwnPost,
  listOwnTextPosts,
  ContentRequestError,
} from "../../packages/api-client/src/content";
afterEach(() => vi.unstubAllGlobals());

it("validates requests before transport and preserves server conflict errors", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    createOwnTextPost("/api", { text: " ", locationLabel: "" }),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockResolvedValue(
    new Response(JSON.stringify({ code: "CONTENT_CONFLICT" }), { status: 409 }),
  );
  await expect(
    editOwnTextPost("/api", "00000000-0000-4000-8000-000000000001", {
      text: "edit",
      locationLabel: "",
      version: 1,
    }),
  ).rejects.toEqual(new ContentRequestError("CONTENT_CONFLICT"));
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
  });
});

it("uses the author restore route and encodes stable cursor pairs without leaking extra fields", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const post = {
    id,
    authorId: id,
    text: "restored",
    locationLabel: "",
    audience: "PUBLIC",
    version: 3,
    deletedAt: null,
    createdAt: "2026-10-25T00:00:00Z",
    updatedAt: "2026-10-25T00:00:00Z",
  };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ post })))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ posts: [], nextCursor: null })),
    );
  vi.stubGlobal("fetch", fetcher);
  expect(await restoreOwnPost("/api", id, 2)).toEqual(post);
  expect(fetcher.mock.calls[0][0]).toBe(
    `/api/v1/content/me/posts/${id}/restore`,
  );
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    method: "POST",
    body: '{"version":2}',
  });
  await listOwnTextPosts("/api", true, {
    at: "2026-10-25T00:00:00.123456Z",
    id,
  });
  expect(String(fetcher.mock.calls[1][0])).toContain(
    "deleted=true&afterTime=2026-10-25T00%3A00%3A00.123456Z&afterId=",
  );
});
