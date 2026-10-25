import { uploadInputSchema } from "@vq/contracts";
import type {
  MediaRepository,
  MediaStorage,
  ImageProcessor,
} from "../domain/ports";
import { MediaError } from "../domain/error";

export function createMedia(
  repository: MediaRepository,
  storage: MediaStorage,
  processor: ImageProcessor,
  contentAccess?: (
    postId: string,
    mediaId: string,
    actor?: string,
  ) => Promise<boolean>,
) {
  let activeUploads = 0;
  return {
    async canAttachContent(userId: string, id: string) {
      const record = await repository.read(id);
      return (
        record?.ownerId === userId &&
        record.status === "ready" &&
        record.visibility === "content"
      );
    },
    async canAttachPublic(userId: string, id: string) {
      const record = await repository.read(id);
      return (
        record?.ownerId === userId &&
        record.status === "ready" &&
        record.visibility === "public"
      );
    },
    async retire(ownerId: string, id: string) {
      try {
        if (!(await repository.markDeleted(id, ownerId))) return;
      } catch (error) {
        if (error instanceof MediaError && error.code === "MEDIA_ATTACHED")
          return;
        throw error;
      }
      await storage.remove(id);
      await repository.completeCleanup(id);
    },
    async canAttach(userId: string, id: string) {
      const record = await repository.read(id);
      return (
        record?.ownerId === userId &&
        record.status === "ready" &&
        record.visibility !== "content"
      );
    },
    async cleanup() {
      await repository.expireUploads();
      for (const id of await repository.cleanupJobs()) {
        try {
          await storage.remove(id);
          await repository.completeCleanup(id);
        } catch {
          await repository.retryCleanup(id);
        }
      }
    },
    request(ownerId: string, input: unknown) {
      return repository.create(
        ownerId,
        uploadInputSchema.parse(input).visibility,
      );
    },
    async upload(ownerId: string, id: string, bytes: Uint8Array, mime: string) {
      if (activeUploads >= 2) throw new MediaError("MEDIA_BUSY");
      activeUploads++;
      try {
        if (!(await repository.claim(id, ownerId)))
          throw new MediaError("UPLOAD_NOT_AVAILABLE");
        try {
          if (bytes.byteLength < 12 || bytes.byteLength > 8 * 1024 * 1024)
            throw new MediaError("INVALID_IMAGE");
          const output = await processor.process(bytes, mime);
          await storage.write(id, "image", output.image);
          await storage.write(id, "thumbnail", output.thumbnail);
          return await repository.ready(id, output);
        } catch (error) {
          // Only a confirmed failure transaction can authorize immediate removal.
          if (await repository.fail(id)) {
            try {
              await storage.remove(id);
              await repository.completeCleanup(id);
            } catch {
              // The failed state and durable cleanup job survive this request.
            }
          }
          throw error;
        }
      } finally {
        activeUploads--;
      }
    },
    async retrieve(
      id: string,
      variant: "image" | "thumbnail",
      userId: string | undefined,
      postId?: string,
    ) {
      const record = await repository.read(id);
      if (
        !record ||
        record.status !== "ready" ||
        (record.visibility === "private" && record.ownerId !== userId) ||
        (record.visibility === "content" &&
          (!postId || !(await contentAccess?.(postId, id, userId))))
      )
        throw new MediaError("MEDIA_NOT_FOUND");
      return {
        bytes: await storage.read(id, variant),
        visibility: record.visibility,
      };
    },
    async remove(ownerId: string, id: string) {
      if (!(await repository.markDeleted(id, ownerId)))
        throw new MediaError("MEDIA_NOT_FOUND");
      await storage.remove(id);
      await repository.completeCleanup(id);
    },
  };
}
