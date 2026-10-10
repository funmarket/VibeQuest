import type { FastifyInstance } from "fastify";
import { boundsSchema } from "@vq/contracts";
import {
  PlacesUnavailableError,
  type ListPublishedPlaces,
} from "./application/list-published-places";

export function registerPlacesRoutes(
  app: FastifyInstance,
  listPublishedPlaces: ListPublishedPlaces,
) {
  app.get("/v1/places", async (request, reply) => {
    const parsed = boundsSchema.safeParse(request.query);
    if (!parsed.success)
      return reply.code(400).send({
        error: {
          code: "INVALID_PLACES_QUERY",
          message: "Provide a valid bounded viewport and filters.",
        },
      });
    try {
      return await listPublishedPlaces(parsed.data);
    } catch (error) {
      request.log.error({ err: error }, "Places read failed");
      if (!(error instanceof PlacesUnavailableError)) throw error;
      return reply
        .code(503)
        .send({ error: { code: error.code, message: error.message } });
    }
  });
}
