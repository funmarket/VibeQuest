import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  contentVersionSchema,
  contentIdSchema,
  contentOwnQuerySchema,
  gossipTextPostResponseSchema,
  contentOwnListSchema,
  contentPageQuerySchema,
  gossipViewResponseSchema,
  gossipFeedSchema,
  gossipCommentInputSchema,
  gossipCommentsSchema,
  gossipCommentResponseSchema,
  gossipReactionSchema,
  gossipReportInputSchema,
  moderationDecisionSchema,
  reportResponseSchema,
  moderationCasesSchema,
  moderationEvidenceResponseSchema,
  moderationCapabilitySchema,
} from "@vq/contracts";
import type { Account } from "@vq/contracts";
import { createContent, ContentError } from "@vq/content";
import type { ContentRepository } from "@vq/content";
import type {
  ContentGraph,
  ContentMedia,
  ContentProfiles,
} from "@vq/content/ports";

/** Social Content routes; actors and moderation authority come from Identity. */
export function registerContentRoutes(
  app: FastifyInstance,
  repository: ContentRepository,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
  dependencies: {
    graph?: ContentGraph;
    media?: ContentMedia;
    profiles?: ContentProfiles;
    canModerate?: (actor: string) => Promise<boolean>;
  } = {},
) {
  const content = createContent(repository, dependencies);
  app.register(async (scope) => {
    scope.addHook("onRequest", async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      if (
        request.method !== "GET" &&
        !origins.includes(request.headers.origin ?? "")
      )
        return reply.code(403).send({ code: "ORIGIN_REJECTED" });
    });
    scope.setErrorHandler((error, _request, reply) => {
      if (error instanceof ContentError)
        return reply
          .code(
            error.code === "CONTENT_NOT_FOUND"
              ? 404
              : error.code === "CONTENT_RESTORE_EXPIRED" ||
                  error.code === "REPORT_EXPIRED"
                ? 410
                : error.code === "INVALID_CONTENT"
                  ? 400
                  : error.code === "INVALID_CONTENT_MEDIA"
                    ? 422
                    : error.code === "CONTENT_UNAVAILABLE"
                      ? 503
                      : error.code === "CONTENT_FORBIDDEN"
                        ? 403
                        : 409,
          )
          .send({ code: error.code });
      if (
        error instanceof Error &&
        "statusCode" in error &&
        typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      )
        return reply.code(error.statusCode).send({ code: "INVALID_INPUT" });
      scope.log.error({ err: error }, "Social Content request failed");
      return reply.code(503).send({ code: "CONTENT_UNAVAILABLE" });
    });
    const base = "/v1/content/me/posts";
    scope.get("/v1/content/moderation/capability", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      return moderationCapabilitySchema.parse({
        allowed: (await dependencies.canModerate?.(actor.id)) ?? false,
      });
    });
    scope.get("/v1/content/moderation/reports", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const q = contentPageQuerySchema.safeParse(request.query);
      if (!q.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return moderationCasesSchema.parse(
        await content.cases(
          actor.id,
          q.data.afterTime
            ? { at: q.data.afterTime, id: q.data.afterId! }
            : null,
        ),
      );
    });
    scope.get("/v1/content/moderation/reports/:id", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = contentIdSchema.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return moderationEvidenceResponseSchema.parse(
        await content.evidence(actor.id, id.data),
      );
    });
    scope.put("/v1/content/moderation/reports/:id", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = contentIdSchema.safeParse(
          (request.params as { id: string }).id,
        ),
        input = moderationDecisionSchema.safeParse(request.body);
      if (!id.success || !input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reportResponseSchema.parse({
        report: await content.decide(actor.id, id.data, input.data),
      });
    });
    for (const target of ["post", "comment"] as const)
      scope.post(
        `/v1/content/posts/:id${target === "comment" ? "/comments/:commentId" : ""}/reports`,
        async (request, reply) => {
          const actor = await authenticate(request);
          if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
          const params = request.params as { id: string; commentId?: string };
          const id = contentIdSchema.safeParse(params.id),
            input = gossipReportInputSchema.safeParse(request.body),
            comment =
              target === "comment"
                ? contentIdSchema.safeParse(params.commentId)
                : null;
          if (!id.success || !input.success || (comment && !comment.success))
            return reply.code(400).send({ code: "INVALID_INPUT" });
          return reply.code(201).send(
            reportResponseSchema.parse({
              report: await content.report(
                id.data,
                actor.id,
                input.data,
                comment?.success ? comment.data : undefined,
              ),
            }),
          );
        },
      );
    scope.get("/v1/content/feed", async (request, reply) => {
      const q = contentPageQuerySchema.safeParse(request.query);
      if (!q.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return gossipFeedSchema.parse(
        await content.feed(
          (await authenticate(request))?.id,
          q.data.afterTime
            ? { at: q.data.afterTime, id: q.data.afterId! }
            : null,
        ),
      );
    });
    scope.get("/v1/content/posts/:id", async (request, reply) => {
      const id = contentIdSchema.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return gossipViewResponseSchema.parse({
        post: await content.read(id.data, (await authenticate(request))?.id),
      });
    });
    scope.get("/v1/content/posts/:id/comments", async (request, reply) => {
      const id = contentIdSchema.safeParse(
        (request.params as { id: string }).id,
      );
      const q = contentPageQuerySchema.safeParse(request.query);
      if (!id.success || !q.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return gossipCommentsSchema.parse(
        await content.comments(
          id.data,
          (await authenticate(request))?.id,
          q.data.afterTime
            ? { at: q.data.afterTime, id: q.data.afterId! }
            : null,
        ),
      );
    });
    scope.post("/v1/content/posts/:id/comments", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = contentIdSchema.safeParse(
          (request.params as { id: string }).id,
        ),
        input = gossipCommentInputSchema.safeParse(request.body);
      if (!id.success || !input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply.code(201).send(
        gossipCommentResponseSchema.parse({
          comment: await content.comment(id.data, actor.id, input.data),
        }),
      );
    });
    scope.delete(
      "/v1/content/posts/:id/comments/:commentId",
      async (request, reply) => {
        const actor = await authenticate(request);
        if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        const params = request.params as { id: string; commentId: string };
        const id = contentIdSchema.safeParse(params.id),
          comment = contentIdSchema.safeParse(params.commentId);
        if (!id.success || !comment.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        await content.deleteComment(id.data, comment.data, actor.id);
        return reply.code(204).send();
      },
    );
    scope.put("/v1/content/posts/:id/reaction", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = contentIdSchema.safeParse(
          (request.params as { id: string }).id,
        ),
        input = gossipReactionSchema.safeParse(request.body);
      if (!id.success || !input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return gossipViewResponseSchema.parse({
        post: await content.react(id.data, actor.id, input.data.liked),
      });
    });
    scope.post(base, async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = gossipTextInputSchema.safeParse(request.body);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply.code(201).send(
        gossipTextPostResponseSchema.parse({
          post: await content.createText(actor.id, input.data),
        }),
      );
    });
    scope.get(base, async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = contentOwnQuerySchema.safeParse(request.query);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      const q = input.data;
      return contentOwnListSchema.parse(
        await content.listOwn(
          actor.id,
          q.deleted,
          q.afterTime ? { at: q.afterTime, id: q.afterId! } : null,
        ),
      );
    });
    scope.get(`${base}/:id`, async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = contentIdSchema.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return gossipTextPostResponseSchema.parse({
        post: await content.readOwn(actor.id, id.data),
      });
    });
    for (const action of ["edit", "delete", "restore"] as const) {
      scope.route({
        method:
          action === "edit" ? "PUT" : action === "delete" ? "DELETE" : "POST",
        url: `${base}/:id${action === "restore" ? "/restore" : ""}`,
        handler: async (request, reply) => {
          const actor = await authenticate(request);
          if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
          const id = contentIdSchema.safeParse(
            (request.params as { id: string }).id,
          );
          const input = (
            action === "edit" ? gossipTextEditSchema : contentVersionSchema
          ).safeParse(request.body);
          if (!id.success || !input.success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          const post =
            action === "edit"
              ? await content.editText(actor.id, id.data, input.data)
              : action === "delete"
                ? await content.deleteOwn(actor.id, id.data, input.data)
                : await content.restoreOwn(actor.id, id.data, input.data);
          return gossipTextPostResponseSchema.parse({ post });
        },
      });
    }
  });
  return content;
}
