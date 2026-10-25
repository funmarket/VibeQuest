import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  followInputSchema,
  blockInputSchema,
  blockedPeopleSchema,
  socialQuerySchema,
  publicProfileSchema,
  socialListSchema,
  socialStateSchema,
  relationshipSchema,
  type Account,
} from "@vq/contracts";
import {
  createSocial,
  SocialError,
  type SocialRepository,
  type SocialAccounts,
  type SocialProfiles,
} from "@vq/social";
export function registerSocialRoutes(
  app: FastifyInstance,
  repository: SocialRepository,
  accounts: SocialAccounts,
  profiles: SocialProfiles,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const social = createSocial(repository, accounts, profiles);
  app.register(async (scope) => {
    scope.addHook("onRequest", async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      if (
        request.method !== "GET" &&
        !origins.includes(request.headers.origin ?? "")
      )
        return reply.code(403).send({ code: "ORIGIN_REJECTED" });
    });
    scope.get("/v1/social/me/blocked", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      return blockedPeopleSchema.parse(await social.blockedUsers(actor.id));
    });
    scope.setErrorHandler((error, _request, reply) => {
      if (error instanceof SocialError)
        return reply
          .code(
            error.code === "SOCIAL_NOT_FOUND"
              ? 404
              : error.code === "AUTH_REQUIRED"
                ? 401
                : error.code === "SOCIAL_BLOCKED"
                  ? 403
                  : 422,
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
      scope.log.error({ err: error }, "Social Graph request failed");
      return reply.code(503).send({ code: "SOCIAL_UNAVAILABLE" });
    });
    scope.get("/v1/social/me", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const query = socialQuerySchema.safeParse(request.query);
      if (!query.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return socialListSchema.parse(
        await social.list(
          actor.id,
          query.data.side,
          query.data.afterTime
            ? { at: query.data.afterTime, id: query.data.afterId! }
            : null,
        ),
      );
    });
    scope.get("/v1/social/users/:id", async (request, reply) => {
      const id = publicProfileSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      return socialStateSchema.parse(
        await social.state(id.data, (await authenticate(request))?.id),
      );
    });
    scope.put("/v1/social/users/:id/follow", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = publicProfileSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      const input = followInputSchema.safeParse(request.body);
      if (!id.success || !input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return relationshipSchema.parse(
        await social.follow(actor.id, id.data, input.data.following),
      );
    });
    scope.put("/v1/social/users/:id/block", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = publicProfileSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      const input = blockInputSchema.safeParse(request.body);
      if (!id.success || !input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return social.block(actor.id, id.data, input.data.blocked);
    });
  });
  return social;
}
