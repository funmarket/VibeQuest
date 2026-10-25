import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  contentVersionSchema,
  contentIdSchema,
  contentCursorSchema,
} from "@vq/contracts";
import type { ContentCursor } from "@vq/contracts";
import type { ContentRepository } from "../domain/ports";
import { ContentError } from "../domain/invariants";

export function createContent(repository: ContentRepository) {
  return {
    createText(actorId: string, input: unknown) {
      return repository.createText(actorId, gossipTextInputSchema.parse(input));
    },
    async readOwn(actorId: string, id: string) {
      const post = await repository.readOwn(actorId, contentIdSchema.parse(id));
      if (!post) throw new ContentError("CONTENT_NOT_FOUND");
      return post;
    },
    listOwn(actorId: string, deleted: boolean, after: ContentCursor | null) {
      return repository.listOwn(
        actorId,
        deleted,
        after && contentCursorSchema.parse(after),
      );
    },
    editText(actorId: string, id: string, input: unknown) {
      return repository.editText(
        actorId,
        contentIdSchema.parse(id),
        gossipTextEditSchema.parse(input),
      );
    },
    deleteOwn(actorId: string, id: string, input: unknown) {
      return repository.deleteOwn(
        actorId,
        contentIdSchema.parse(id),
        contentVersionSchema.parse(input).version,
      );
    },
    restoreOwn(actorId: string, id: string, input: unknown) {
      return repository.restoreOwn(
        actorId,
        contentIdSchema.parse(id),
        contentVersionSchema.parse(input).version,
      );
    },
    purgeExpired: repository.purgeExpired,
  };
}
