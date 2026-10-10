export class MediaError extends Error {
  constructor(
    public readonly code:
      | "MEDIA_NOT_FOUND"
      | "UPLOAD_NOT_AVAILABLE"
      | "INVALID_IMAGE"
      | "MEDIA_BUSY"
      | "MEDIA_ATTACHED",
  ) {
    super(code);
  }
}
