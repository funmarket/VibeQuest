import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  businessInputSchema,
  businessInviteSchema,
  businessAcceptSchema,
  businessReviewSchema,
  businessResponseSchema,
  businessesResponseSchema,
  businessSchema,
  type Account,
} from "@vq/contracts";
import {
  createBusinesses,
  BusinessError,
  type BusinessRepository,
  type BusinessReviewAuthority,
} from "@vq/business";
export function registerBusinessRoutes(
  app: FastifyInstance,
  repository: BusinessRepository,
  authority: BusinessReviewAuthority,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const businesses = createBusinesses(repository, authority);
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
      if (error instanceof BusinessError)
        return reply
          .code(
            error.code === "BUSINESS_FORBIDDEN"
              ? 403
              : error.code === "MEMBER_UNAVAILABLE"
                ? 404
                : 409,
          )
          .send({ code: error.code });
      return reply.code(503).send({ code: "BUSINESS_UNAVAILABLE" });
    });
    scope.get("/v1/businesses/me", async (request, reply) => {
      const account = await authenticate(request);
      if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      return businessesResponseSchema.parse({
        businesses: await businesses.mine(account.id),
      });
    });
    scope.post("/v1/businesses", async (request, reply) => {
      const account = await authenticate(request);
      if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = businessInputSchema.safeParse(request.body);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply.code(201).send(
        businessResponseSchema.parse({
          business: await businesses.create(account.id, input.data),
        }),
      );
    });
    for (const action of ["members", "membership/accept", "review"] as const)
      scope.post(`/v1/businesses/:id/${action}`, async (request, reply) => {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        const id = businessSchema.shape.id.safeParse(
          (request.params as { id: string }).id,
        );
        if (!id.success) return reply.code(400).send({ code: "INVALID_INPUT" });
        if (action === "membership/accept") {
          if (!businessAcceptSchema.safeParse(request.body ?? {}).success)
            return reply.code(400).send({ code: "INVALID_INPUT" });
          return businessResponseSchema.parse({
            business: await businesses.accept(account.id, id.data),
          });
        }
        const input = (
          action === "members" ? businessInviteSchema : businessReviewSchema
        ).safeParse(request.body);
        if (!input.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        if (action === "members") {
          await businesses.invite(account.id, id.data, input.data);
          return reply.code(201).send({ status: "invited" });
        }
        await businesses.review(account.id, id.data, input.data);
        return { status: "reviewed" };
      });
  });
  return businesses;
}
