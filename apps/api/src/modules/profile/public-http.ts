import type { FastifyInstance } from "fastify";
import {
  publicProfileResponseSchema,
  publicProfileSchema,
  profileInputSchema,
  type PublicProfile,
} from "@vq/contracts";
export function registerPublicProfileRoutes(
  app: FastifyInstance,
  profiles: {
    publicHandle(handle: string): Promise<PublicProfile | null>;
    publicMany(ids: string[]): Promise<PublicProfile[]>;
  },
) {
  app.register(async (scope) => {
    scope.addHook("onRequest", async (_request, reply) => {
      reply.header("Cache-Control", "no-store");
    });
    scope.setErrorHandler((error, _request, reply) => {
      scope.log.error({ err: error }, "Public Profile read failed");
      reply.code(503).send({ code: "PROFILE_UNAVAILABLE" });
    });
    scope.get("/v1/public-profiles/handle/:handle", async (request, reply) => {
      const parsed = profileInputSchema.shape.handle.safeParse(
        (request.params as { handle: string }).handle,
      );
      if (!parsed.success || !parsed.data)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      const profile = await profiles.publicHandle(parsed.data);
      if (!profile) return reply.code(404).send({ code: "PROFILE_NOT_FOUND" });
      return publicProfileResponseSchema.parse({ profile });
    });
    scope.get("/v1/public-profiles/id/:id", async (request, reply) => {
      const parsed = publicProfileSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      if (!parsed.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      const profile = (await profiles.publicMany([parsed.data]))[0];
      if (!profile) return reply.code(404).send({ code: "PROFILE_NOT_FOUND" });
      return publicProfileResponseSchema.parse({ profile });
    });
  });
}
