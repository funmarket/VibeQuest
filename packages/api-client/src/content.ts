import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  gossipTextPostResponseSchema,
  contentOwnListSchema,
  contentIdSchema,
  contentVersionSchema,
  contentCursorSchema,
} from "@vq/contracts";
import type { ContentCursor } from "@vq/contracts";

export class ContentRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
async function request(
  base: string,
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  input?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${base.replace(/\/$/, "")}/v1/content/me/posts${path}`,
    {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
        ...(input === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ContentRequestError(
      typeof body?.code === "string" ? body.code : "CONTENT_UNAVAILABLE",
    );
  }
  return response.json();
}
export async function createOwnTextPost(base: string, input: unknown) {
  return gossipTextPostResponseSchema.parse(
    await request(base, "", "POST", gossipTextInputSchema.parse(input)),
  ).post;
}
export async function readOwnTextPost(
  base: string,
  id: string,
  signal?: AbortSignal,
) {
  return gossipTextPostResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "GET",
      undefined,
      signal,
    ),
  ).post;
}
export async function listOwnTextPosts(
  base: string,
  deleted = false,
  after: ContentCursor | null = null,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ deleted: String(deleted) });
  if (after) {
    const cursor = contentCursorSchema.parse(after);
    params.set("afterTime", cursor.at);
    params.set("afterId", cursor.id);
  }
  return contentOwnListSchema.parse(
    await request(base, `?${params}`, "GET", undefined, signal),
  );
}
export async function editOwnTextPost(
  base: string,
  id: string,
  input: unknown,
) {
  return gossipTextPostResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "PUT",
      gossipTextEditSchema.parse(input),
    ),
  ).post;
}
export async function deleteOwnPost(base: string, id: string, version: number) {
  return gossipTextPostResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "DELETE",
      contentVersionSchema.parse({ version }),
    ),
  ).post;
}
export async function restoreOwnPost(
  base: string,
  id: string,
  version: number,
) {
  return gossipTextPostResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}/restore`,
      "POST",
      contentVersionSchema.parse({ version }),
    ),
  ).post;
}
