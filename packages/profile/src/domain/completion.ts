/** Primary source requires a name and biography; business status is unrelated. */
export function isProfileComplete(profile: {
  name: string;
  bio: string;
}): boolean {
  return profile.name.trim().length > 0 && profile.bio.trim().length > 0;
}
export class ProfileError extends Error {
  constructor(
    public readonly code:
      "STALE_PROFILE" | "HANDLE_UNAVAILABLE" | "INVALID_PROFILE_MEDIA",
  ) {
    super(code);
  }
}
