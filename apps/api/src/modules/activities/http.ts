import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  activityInputSchema,
  activityEditSchema,
  activityVersionSchema,
  activitySaveSchema,
  activityReviewInputSchema,
  activityQuerySchema,
  activitySchema,
  activityResponseSchema,
  activitiesResponseSchema,
  activityReviewsResponseSchema,
  type Account,
} from "@vq/contracts";
import {
  createActivities,
  ActivityError,
  type ActivitiesRepository,
  type ActivityProfiles,
  type ActivityMedia,
} from "@vq/activities";
export function registerActivitiesRoutes(
  app: FastifyInstance,
  repository: ActivitiesRepository,
  profiles: ActivityProfiles,
  media: ActivityMedia | undefined,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const activities = createActivities(repository, profiles, media);
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
      if (
        error instanceof Error &&
        "statusCode" in error &&
        typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      )
        return reply.code(error.statusCode).send({ code: "INVALID_INPUT" });
      if (error instanceof ActivityError) {
        const status =
          error.code === "ACTIVITY_NOT_FOUND"
            ? 404
            : ["PROFILE_INCOMPLETE", "ACTIVITY_FORBIDDEN"].includes(error.code)
              ? 403
              : error.code === "ACTIVITY_CONFLICT"
                ? 409
                : 422;
        return reply.code(status).send({ code: error.code });
      }
      scope.log.error({ err: error }, "Activities request failed");
      return reply.code(503).send({ code: "ACTIVITIES_UNAVAILABLE" });
    });
    scope.get("/v1/activities", async (request, reply) => {
      const query = activityQuerySchema.safeParse(request.query);
      if (!query.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      const actor = await authenticate(request);
      return activitiesResponseSchema.parse(
        await activities.list(query.data.tab, query.data.offset, actor?.id),
      );
    });
    scope.post("/v1/activities", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = activityInputSchema.safeParse(request.body);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply.code(201).send(
        activityResponseSchema.parse({
          activity: await activities.create(actor.id, input.data),
        }),
      );
    });
    scope.get("/v1/activities/:id", async (request, reply) => {
      const id = activitySchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      const actor = await authenticate(request);
      const activity = await activities.read(id.data, actor?.id);
      if (!activity)
        return reply.code(404).send({ code: "ACTIVITY_NOT_FOUND" });
      return activityResponseSchema.parse({ activity });
    });
    scope.get("/v1/activities/:id/reviews", async (request, reply) => {
      const id = activitySchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      const query = activityQuerySchema.safeParse(request.query);
      if (!id.success || !query.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return activityReviewsResponseSchema.parse(
        await activities.reviews(id.data, query.data.offset),
      );
    });
    for (const action of ["edit", "cancel", "save", "reviews"] as const) {
      scope.route({
        method: action === "edit" || action === "save" ? "PUT" : "POST",
        url: `/v1/activities/:id${action === "edit" ? "" : `/${action}`}`,
        handler: async (request, reply) => {
          const actor = await authenticate(request);
          if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
          const id = activitySchema.shape.id.safeParse(
            (request.params as { id: string }).id,
          );
          if (!id.success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          if (action === "edit") {
            const input = activityEditSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            return activityResponseSchema.parse({
              activity: await activities.edit(actor.id, id.data, input.data),
            });
          }
          if (action === "cancel") {
            const input = activityVersionSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            return activityResponseSchema.parse({
              activity: await activities.cancel(
                actor.id,
                id.data,
                input.data.version,
              ),
            });
          }
          if (action === "save") {
            const input = activitySaveSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            await activities.save(actor.id, id.data, input.data.saved);
            return { status: "saved" };
          }
          const input = activityReviewInputSchema.safeParse(request.body);
          if (!input.success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          await activities.review(actor.id, id.data, input.data);
          return reply.code(201).send({ status: "reviewed" });
        },
      });
    }
  });
  return activities;
}
