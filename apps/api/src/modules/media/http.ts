import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  mediaResponseSchema,
  mediaSchema,
  uploadInputSchema,
  type Account,
} from "@vq/contracts";
import {
  createMedia,
  MediaError,
  type MediaRepository,
  type MediaStorage,
  type ImageProcessor,
} from "@vq/media";

export function registerMediaRoutes(
  app: FastifyInstance,
  repository: MediaRepository,
  storage: MediaStorage,
  processor: ImageProcessor,
  authenticate: (request: FastifyRequest) => Promise<Account | null>,
  origins: string[],
) {
  const media = createMedia(repository, storage, processor);
  function response(record: Awaited<ReturnType<typeof media.request>>) {
    return mediaResponseSchema.parse({
      media: {
        id: record.id,
        visibility: record.visibility,
        status: record.status,
        width: record.width,
        height: record.height,
        expiresAt: record.expiresAt,
      },
    });
  }
  app.register(async (scope) => {
    scope.addContentTypeParser(
      ["image/png", "image/jpeg", "image/webp"],
      { parseAs: "buffer", bodyLimit: 8 * 1024 * 1024 },
      (_request, body, done) => done(null, body),
    );
    scope.addHook("onRequest", async (request, reply) => {
      if (
        request.method !== "GET" &&
        !origins.includes(request.headers.origin ?? "")
      )
        return reply.code(403).send({ code: "ORIGIN_REJECTED" });
    });
    scope.setErrorHandler((error, _request, reply) => {
      if (error instanceof MediaError && error.code === "MEDIA_BUSY")
        return reply
          .header("Retry-After", "1")
          .code(503)
          .send({ code: error.code });
      if (error instanceof MediaError)
        return reply
          .code(
            error.code === "INVALID_IMAGE"
              ? 422
              : error.code === "UPLOAD_NOT_AVAILABLE" ||
                  error.code === "MEDIA_ATTACHED"
                ? 409
                : 404,
          )
          .send({ code: error.code });
      const tooLarge =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        error.statusCode === 413;
      const unsupported =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        error.statusCode === 415;
      return reply.code(tooLarge ? 413 : unsupported ? 415 : 503).send({
        code: tooLarge
          ? "FILE_TOO_LARGE"
          : unsupported
            ? "UNSUPPORTED_MEDIA_TYPE"
            : "MEDIA_UNAVAILABLE",
      });
    });
    scope.post("/v1/media/uploads", async (request, reply) => {
      const account = await authenticate(request);
      if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const input = uploadInputSchema.safeParse(request.body);
      if (!input.success)
        return reply.code(400).send({ code: "INVALID_INPUT" });
      return reply
        .header("Cache-Control", "no-store")
        .code(201)
        .send(response(await media.request(account.id, input.data)));
    });
    scope.put(
      "/v1/media/uploads/:id",
      { bodyLimit: 8 * 1024 * 1024 },
      async (request, reply) => {
        const account = await authenticate(request);
        if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(
            request.headers["content-type"] ?? "",
          )
        )
          return reply.code(415).send({ code: "UNSUPPORTED_MEDIA_TYPE" });
        const id = mediaSchema.shape.id.safeParse(
          (request.params as { id: string }).id,
        );
        if (!id.success || !Buffer.isBuffer(request.body))
          return reply.code(400).send({ code: "INVALID_INPUT" });
        return reply
          .header("Cache-Control", "no-store")
          .send(
            response(
              await media.upload(
                account.id,
                id.data,
                request.body,
                request.headers["content-type"] ?? "",
              ),
            ),
          );
      },
    );
    scope.get("/v1/media/:id/:variant", async (request, reply) => {
      const parameters = request.params as { id: string; variant: string };
      const id = mediaSchema.shape.id.safeParse(parameters.id);
      if (!id.success || !["image", "thumbnail"].includes(parameters.variant))
        return reply.code(404).send({ code: "MEDIA_NOT_FOUND" });
      const account = await authenticate(request);
      const result = await media.retrieve(
        id.data,
        parameters.variant as "image" | "thumbnail",
        account?.id,
      );
      return reply
        .header(
          "Cache-Control",
          result.visibility === "public"
            ? "public, max-age=60"
            : "private, no-store",
        )
        .header("X-Content-Type-Options", "nosniff")
        .type("image/webp")
        .send(Buffer.from(result.bytes));
    });
    scope.delete("/v1/media/:id", async (request, reply) => {
      const account = await authenticate(request);
      if (!account) return reply.code(401).send({ code: "AUTH_REQUIRED" });
      const id = mediaSchema.shape.id.safeParse(
        (request.params as { id: string }).id,
      );
      if (!id.success) return reply.code(404).send({ code: "MEDIA_NOT_FOUND" });
      await media.remove(account.id, id.data);
      return reply.code(204).send();
    });
  });
  return media;
}
