import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Account } from "@vq/contracts";
import {
  profileInputSchema,
  profileResponseSchema,
  profilePhotoInputSchema,
  handleAvailabilityQuerySchema,
  handleAvailabilityResponseSchema,
} from "@vq/contracts";
import {
  createProfiles,
  ProfileError,
  type ProfileRepository,
  type ProfileMedia,
} from "@vq/profile";

export function registerProfileRoutes(
  app: FastifyInstance,
  repository: ProfileRepository,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
  media?: ProfileMedia,
  accounts?: { availableUsers(ids: string[]): Promise<string[]> },
) {
  const profiles = createProfiles(repository, media, accounts);
  app.register(async (scope) => {
    scope.addHook("onRequest", async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      if (
        request.method !== "GET" &&
        !origins.includes(request.headers.origin ?? "")
      )
        return reply.code(403).send({ code: "ORIGIN_REJECTED" });
    });
    scope.get("/v1/profile/me", async (request, reply) => {
      try {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        return profileResponseSchema.parse({
          profile: await profiles.read(account.id),
        });
      } catch {
        return reply.code(503).send({ code: "PROFILE_UNAVAILABLE" });
      }
    });
    scope.put("/v1/profile/me", async (request, reply) => {
      try {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        const input = profileInputSchema.safeParse(request.body);
        if (!input.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return profileResponseSchema.parse({
          profile: await profiles.save(account.id, input.data),
        });
      } catch (error) {
        return reply.code(error instanceof ProfileError ? 409 : 503).send({
          code:
            error instanceof ProfileError ? error.code : "PROFILE_UNAVAILABLE",
        });
      }
    });
    scope.put("/v1/profile/photo", async (request, reply) => {
      try {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        const input = profilePhotoInputSchema.safeParse(request.body);
        if (!input.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return profileResponseSchema.parse({
          profile: await profiles.photo(account.id, input.data),
        });
      } catch (error) {
        return reply
          .code(
            error instanceof ProfileError
              ? error.code === "INVALID_PROFILE_MEDIA"
                ? 422
                : 409
              : 503,
          )
          .send({
            code:
              error instanceof ProfileError
                ? error.code
                : "PROFILE_UNAVAILABLE",
          });
      }
    });
    scope.get("/v1/profile/handle", async (request, reply) => {
      try {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        const query = handleAvailabilityQuerySchema.safeParse(request.query);
        if (!query.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return handleAvailabilityResponseSchema.parse({
          available: await profiles.available(query.data.handle, account.id),
        });
      } catch {
        return reply.code(503).send({ code: "PROFILE_UNAVAILABLE" });
      }
    });
  });
  return profiles;
}
