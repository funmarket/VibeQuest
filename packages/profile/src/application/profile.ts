import { profileInputSchema, profilePhotoInputSchema } from "@vq/contracts";
import type { ProfileRepository, ProfileMedia } from "../domain/ports";
import { ProfileError } from "../domain/completion";
export function createProfiles(
  repository: ProfileRepository,
  media?: ProfileMedia,
  accounts?: { availableUsers(ids: string[]): Promise<string[]> },
) {
  return {
    async publicMany(ids: string[]) {
      if (!accounts) throw new Error("Public Identity reader unavailable");
      return repository.publicMany(await accounts.availableUsers(ids));
    },
    async publicHandle(handle: string) {
      const profile = await repository.publicHandle(handle);
      if (
        !profile ||
        !accounts ||
        !(await accounts.availableUsers([profile.id])).length
      )
        return null;
      return profile;
    },
    async cleanupPhotos() {
      if (!media) return;
      for (const job of await repository.photoRetirements()) {
        try {
          await media.retire(job.userId, job.mediaId);
          await repository.finishPhotoRetirement(job.mediaId);
        } catch {
          await repository.retryPhotoRetirement(job.mediaId);
        }
      }
    },
    read: (userId: string) => repository.read(userId),
    save: (userId: string, input: unknown) =>
      repository.save(userId, profileInputSchema.parse(input)),
    available: (handle: string, userId: string) =>
      repository.handleAvailable(handle, userId),
    async photo(userId: string, input: unknown) {
      const parsed = profilePhotoInputSchema.parse(input);
      if (parsed.mediaId && !(await media?.canAttach(userId, parsed.mediaId)))
        throw new ProfileError("INVALID_PROFILE_MEDIA");
      return repository.attachPhoto(userId, parsed.mediaId, parsed.version);
    },
  };
}
