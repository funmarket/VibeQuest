import type { FastifyInstance, FastifyRequest } from "fastify";
import { credentialsSchema, accountResponseSchema } from "@vq/contracts";
import {
  IdentityError,
  createAccounts,
  type IdentityRepository,
} from "@vq/identity";
import { identityCrypto } from "./infrastructure/crypto";

export function readSessionCookie(request: FastifyRequest): string | undefined {
  return request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("vq.session="))
    ?.slice(11);
}
export function registerIdentityRoutes(
  app: FastifyInstance,
  repository: IdentityRepository,
  allowedOrigins: string[],
  secure: boolean,
) {
  const accounts = createAccounts(repository, identityCrypto);
  const cookie = (token: string, clear = false) =>
    `vq.session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 14 * 86400}${secure ? "; Secure" : ""}`;
  app.register(async (scope) => {
    scope.addHook("onRequest", async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      if (
        request.method !== "GET" &&
        !allowedOrigins.includes(request.headers.origin ?? "")
      )
        return reply.code(403).send({ code: "ORIGIN_REJECTED" });
    });
    for (const action of ["register", "login"] as const)
      scope.post(`/v1/identity/${action}`, async (request, reply) => {
        const parsed = credentialsSchema.safeParse(request.body);
        if (!parsed.success)
          return reply.code(400).send({ code: "INVALID_INPUT" });
        try {
          const result = await accounts[action](parsed.data, request.ip);
          reply.header("Set-Cookie", cookie(result.token));
          return reply
            .code(action === "register" ? 201 : 200)
            .send(accountResponseSchema.parse({ account: result.account }));
        } catch (error) {
          if (error instanceof IdentityError)
            return reply
              .code(
                error.code === "RATE_LIMITED"
                  ? 429
                  : error.code === "EMAIL_UNAVAILABLE"
                    ? 409
                    : 401,
              )
              .send({ code: error.code });
          request.log.error(
            { code: "IDENTITY_UNAVAILABLE" },
            "Identity operation failed",
          );
          return reply.code(503).send({ code: "IDENTITY_UNAVAILABLE" });
        }
      });
    scope.get("/v1/identity/me", async (request, reply) => {
      try {
        return accountResponseSchema.parse({
          account: await accounts.me(readSessionCookie(request)),
        });
      } catch {
        return reply.code(503).send({ code: "IDENTITY_UNAVAILABLE" });
      }
    });
    scope.post("/v1/identity/logout", async (request, reply) => {
      try {
        await accounts.logout(readSessionCookie(request));
        return reply.header("Set-Cookie", cookie("", true)).code(204).send();
      } catch {
        return reply.code(503).send({ code: "IDENTITY_UNAVAILABLE" });
      }
    });
  });
  return accounts;
}
