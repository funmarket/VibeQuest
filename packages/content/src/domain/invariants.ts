export class ContentError extends Error {
  constructor(
    public readonly code:
      | "CONTENT_FORBIDDEN"
      | "CONTENT_NOT_FOUND"
      | "CONTENT_CONFLICT"
      | "CONTENT_RESTORE_EXPIRED",
  ) {
    super(code);
  }
}

export function assertPostAuthor(actorId: string, authorId: string) {
  if (actorId !== authorId) throw new ContentError("CONTENT_FORBIDDEN");
}

export function assertPostRestore(deletedAt: string | null, now: number) {
  if (deletedAt === null) throw new ContentError("CONTENT_CONFLICT");
  const deletedTime = Date.parse(deletedAt);
  if (!Number.isFinite(deletedTime) || now >= deletedTime + 11 * 86400_000)
    throw new ContentError("CONTENT_RESTORE_EXPIRED");
}
