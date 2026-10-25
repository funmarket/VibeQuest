import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  gossipTextPostResponseSchema,
  contentOwnListSchema,
  contentIdSchema,
  contentVersionSchema,
  contentCursorSchema,
  gossipFeedSchema,
  gossipViewResponseSchema,
  gossipCommentsSchema,
  gossipCommentResponseSchema,
  gossipCommentInputSchema,
  gossipReactionSchema,
  gossipReportInputSchema,
  reportResponseSchema,
  moderationCasesSchema,
  moderationEvidenceResponseSchema,
  moderationDecisionSchema,
  moderationCapabilitySchema,
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
  resource = "me/posts",
) {
  const response = await fetch(
    `${base.replace(/\/$/, "")}/v1/content/${resource}${path}`,
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
  return response.status === 204 ? null : response.json();
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
function pageQuery(after: ContentCursor | null) {
  const params = new URLSearchParams();
  if (after) {
    const c = contentCursorSchema.parse(after);
    params.set("afterTime", c.at);
    params.set("afterId", c.id);
  }
  return params.toString() ? `?${params}` : "";
}
export async function readGossipFeed(
  base: string,
  after: ContentCursor | null = null,
  signal?: AbortSignal,
) {
  return gossipFeedSchema.parse(
    await request(base, pageQuery(after), "GET", undefined, signal, "feed"),
  );
}
export async function readGossipPost(
  base: string,
  id: string,
  signal?: AbortSignal,
) {
  return gossipViewResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "GET",
      undefined,
      signal,
      "posts",
    ),
  ).post;
}
export async function reactToGossip(base: string, id: string, liked: boolean) {
  return gossipViewResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}/reaction`,
      "PUT",
      gossipReactionSchema.parse({ liked }),
      undefined,
      "posts",
    ),
  ).post;
}
export async function readGossipComments(
  base: string,
  id: string,
  after: ContentCursor | null = null,
  signal?: AbortSignal,
) {
  return gossipCommentsSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}/comments${pageQuery(after)}`,
      "GET",
      undefined,
      signal,
      "posts",
    ),
  );
}
export async function postGossipComment(
  base: string,
  id: string,
  input: unknown,
) {
  return gossipCommentResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}/comments`,
      "POST",
      gossipCommentInputSchema.parse(input),
      undefined,
      "posts",
    ),
  ).comment;
}
export async function removeGossipComment(
  base: string,
  id: string,
  comment: string,
) {
  await request(
    base,
    `/${contentIdSchema.parse(id)}/comments/${contentIdSchema.parse(comment)}`,
    "DELETE",
    undefined,
    undefined,
    "posts",
  );
}
export async function reportGossip(
  base: string,
  id: string,
  input: unknown,
  commentId?: string,
) {
  const path = `/${contentIdSchema.parse(id)}${commentId ? `/comments/${contentIdSchema.parse(commentId)}` : ""}/reports`;
  return reportResponseSchema.parse(
    await request(
      base,
      path,
      "POST",
      gossipReportInputSchema.parse(input),
      undefined,
      "posts",
    ),
  ).report;
}
export async function canModerateGossip(base: string) {
  return moderationCapabilitySchema.parse(
    await request(
      base,
      "",
      "GET",
      undefined,
      undefined,
      "moderation/capability",
    ),
  ).allowed;
}
export async function readModerationCases(
  base: string,
  after: ContentCursor | null = null,
) {
  return moderationCasesSchema.parse(
    await request(
      base,
      pageQuery(after),
      "GET",
      undefined,
      undefined,
      "moderation/reports",
    ),
  );
}
export async function readModerationEvidence(base: string, id: string) {
  return moderationEvidenceResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "GET",
      undefined,
      undefined,
      "moderation/reports",
    ),
  );
}
export async function decideModerationCase(
  base: string,
  id: string,
  input: unknown,
) {
  return reportResponseSchema.parse(
    await request(
      base,
      `/${contentIdSchema.parse(id)}`,
      "PUT",
      moderationDecisionSchema.parse(input),
      undefined,
      "moderation/reports",
    ),
  ).report;
}
