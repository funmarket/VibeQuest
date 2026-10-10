import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  eventInputSchema,
  eventEditSchema,
  eventVersionSchema,
  eventRsvpSchema,
  eventSaveSchema,
  eventReviewInputSchema,
  eventQuerySchema,
  eventSchema,
  eventResponseSchema,
  eventsResponseSchema,
  eventReviewsResponseSchema,
  type Account,
} from "@vq/contracts";
import {
  createEvents,
  EventError,
  type EventsRepository,
  type EventHosts,
  type EventProfiles,
  type EventMedia,
} from "@vq/events";
export function registerEventsRoutes(
  app: FastifyInstance,
  repository: EventsRepository,
  hosts: EventHosts,
  profiles: EventProfiles,
  media: EventMedia | undefined,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const events = createEvents(repository, hosts, profiles, media);
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
      if (error instanceof EventError)
        return reply
          .code(
            error.code === "EVENT_NOT_FOUND"
              ? 404
              : ["EVENT_FORBIDDEN", "EVENT_PROFILE_REQUIRED"].includes(
                    error.code,
                  )
                ? 403
                : error.code === "EVENT_CONFLICT"
                  ? 409
                  : 422,
          )
          .send({ code: error.code });
      scope.log.error({ err: error }, "Events request failed");
      return reply.code(503).send({ code: "EVENTS_UNAVAILABLE" });
    });
    scope.get("/v1/events", async (request, reply) => {
      const query = eventQuerySchema.safeParse(request.query);
      if (!query.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      const actor = await authenticate(request);
      return eventsResponseSchema.parse(
        await events.list(query.data.tab, query.data.offset, actor?.id),
      );
    });
    scope.post("/v1/events", async (request, reply) => {
      const actor = await authenticate(request);
      if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = eventInputSchema.safeParse(request.body);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply.code(201).send(
        eventResponseSchema.parse({
          event: await events.create(actor.id, input.data),
        }),
      );
    });
    scope.get("/v1/events/:id", async (request, reply) => {
      const id = eventSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
      const actor = await authenticate(request);
      return eventResponseSchema.parse({
        event: await events.read(id.data, actor?.id),
      });
    });
    scope.get("/v1/events/:id/reviews", async (request, reply) => {
      const id = eventSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      const query = eventQuerySchema.safeParse(request.query);
      if (!id.success || !query.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return eventReviewsResponseSchema.parse(
        await events.reviews(id.data, query.data.offset),
      );
    });
    for (const action of ["edit", "cancel", "rsvp", "save", "reviews"] as const)
      scope.route({
        method:
          action === "edit" || action === "rsvp" || action === "save"
            ? "PUT"
            : "POST",
        url: `/v1/events/:id${action === "edit" ? "" : `/${action}`}`,
        handler: async (request, reply) => {
          const actor = await authenticate(request);
          if (!actor) return reply.code(401).send({ code: "AUTH_REQUIRED" });
          const id = eventSchema.shape.id.safeParse(
            (request.params as { id: string }).id,
          );
          if (!id.success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          if (action === "edit") {
            const input = eventEditSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            return eventResponseSchema.parse({
              event: await events.edit(actor.id, id.data, input.data),
            });
          }
          if (action === "cancel") {
            const input = eventVersionSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            return eventResponseSchema.parse({
              event: await events.cancel(actor.id, id.data, input.data.version),
            });
          }
          if (action === "rsvp") {
            const input = eventRsvpSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            await events.rsvp(actor.id, id.data, input.data.going);
            return { going: input.data.going };
          }
          if (action === "save") {
            const input = eventSaveSchema.safeParse(request.body);
            if (!input.success)
              return reply.code(400).send({ code: "INVALID_INPUT" });
            await events.save(actor.id, id.data, input.data.saved);
            return { saved: input.data.saved };
          }
          const input = eventReviewInputSchema.safeParse(request.body);
          if (!input.success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          await events.review(actor.id, id.data, input.data);
          return reply.code(201).send({ status: "reviewed" });
        },
      });
  });
  return events;
}
