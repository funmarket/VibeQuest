import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  geoStateSchema,
  geoConsentSchema,
  geoObservationSchema,
  geoPlacesQuerySchema,
  type PlacesQuery,
  type PlacesResponse,
} from "@vq/contracts";
import { createGeo, GeoError } from "@vq/geo";
import type { GeoActor } from "@vq/geo";
export function registerGeoRoutes(
  app: FastifyInstance,
  geo: ReturnType<typeof createGeo>,
  authenticate: <T>(
    request: FastifyRequest,
    work: (actor: GeoActor | null) => Promise<T>,
  ) => Promise<T>,
  origins: string[],
  readPlaces: (query: PlacesQuery) => Promise<PlacesResponse>,
) {
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
      if (error instanceof GeoError)
        return reply
          .code(
            error.code === "GEO_CONFLICT"
              ? 409
              : error.code === "GEO_CONSENT_REQUIRED"
                ? 403
                : 400,
          )
          .send({ code: error.code });
      // Never log reading bodies, coordinates or session material.
      return reply.code(503).send({ code: "GEO_UNAVAILABLE" });
    });
    function run(
      request: FastifyRequest,
      reply: import("fastify").FastifyReply,
      work: (actor: import("@vq/geo").GeoActor) => Promise<unknown>,
    ) {
      return authenticate(request, (actor) =>
        actor
          ? work(actor)
          : Promise.resolve(reply.code(401).send({ code: "AUTH_REQUIRED" })),
      );
    }
    scope.get("/v1/geo/me", (request, reply) =>
      run(request, reply, async (actor) =>
        geoStateSchema.parse(await geo.read(actor)),
      ),
    );
    scope.get("/v1/geo/me/places", (request, reply) =>
      run(request, reply, async (actor) => {
        const query = geoPlacesQuerySchema.safeParse(request.query);
        if (!query.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        const state = await geo.read(actor);
        if (!state.locationConsent || !state.presence)
          return reply.code(403).send({ code: "GEO_LOCATION_UNAVAILABLE" });
        const { latitude, longitude } = state.presence;
        // Preserve the existing Explore viewport size. Personal coordinates stay
        // inside this authenticated request rather than public Places query URLs.
        return readPlaces({
          ...query.data,
          west: Math.max(-180, longitude - 0.05),
          east: Math.min(180, longitude + 0.05),
          south: Math.max(-90, latitude - 0.05),
          north: Math.min(90, latitude + 0.05),
        });
      }),
    );
    scope.put("/v1/geo/me/consent", (request, reply) =>
      run(request, reply, async (actor) => {
        const parsed = geoConsentSchema.safeParse(request.body);
        if (!parsed.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return geoStateSchema.parse(await geo.consent(actor, parsed.data));
      }),
    );
    scope.put("/v1/geo/me/observation", (request, reply) =>
      run(request, reply, async (actor) => {
        const parsed = geoObservationSchema.safeParse(request.body);
        if (!parsed.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return geoStateSchema.parse(await geo.observe(actor, parsed.data));
      }),
    );
    scope.post("/v1/geo/me/unavailable", (request, reply) =>
      run(request, reply, async (actor) => {
        if (
          !request.body ||
          typeof request.body !== "object" ||
          Array.isArray(request.body) ||
          Object.keys(request.body).length
        )
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return geoStateSchema.parse(await geo.unavailable(actor));
      }),
    );
    // There is deliberately no cross-user reader before R11's accepted-match capability.
  });
}
