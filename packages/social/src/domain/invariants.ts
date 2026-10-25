export class SocialError extends Error {
  constructor(
    public readonly code:
      "SOCIAL_NOT_FOUND" | "SELF_FOLLOW" | "AUTH_REQUIRED" | "SOCIAL_BLOCKED",
  ) {
    super(code);
  }
}
export function assertDifferentUsers(actor: string, target: string) {
  if (actor === target) throw new SocialError("SELF_FOLLOW");
}
