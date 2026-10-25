import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  contentVersionSchema,
  contentIdSchema,
  contentOwnQuerySchema,
  gossipTextPostResponseSchema,
  contentOwnListSchema,
} from "@vq/contracts";
import type { Account } from "@vq/contracts";
import { createContent, ContentError } from "@vq/content";
import type { ContentRepository } from "@vq/content";

/** Author-only operations. No public, follower, attachment or moderator reader. */
export function registerContentRoutes(
  app: FastifyInstance,
  repository: ContentRepository,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const content = createContent(repository);
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
              : error.code === "CONTENT_RESTORE_EXPIRED"
                ? 410
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
