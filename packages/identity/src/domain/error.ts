export class IdentityError extends Error {
  constructor(
    public readonly code:
      "INVALID_CREDENTIALS" | "EMAIL_UNAVAILABLE" | "RATE_LIMITED",
  ) {
    super(code);
  }
}
