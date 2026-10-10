import {
  activityInputSchema,
  activityEditSchema,
  activityReviewInputSchema,
} from "@vq/contracts";
import type {
  ActivitiesRepository,
  ActivityProfiles,
  ActivityMedia,
} from "../domain/ports";
import { ActivityError, validateSchedule } from "../domain/invariants";
export function createActivities(
  repository: ActivitiesRepository,
  profiles: ActivityProfiles,
  media?: ActivityMedia,
) {
  async function eligible(actorId: string) {
    const profile = await profiles.read(actorId);
    if (!profile?.completed) throw new ActivityError("PROFILE_INCOMPLETE");
    return profile;
  }
  async function owned(actorId: string, id: string) {
    const item = await repository.read(id, actorId);
    if (!item) throw new ActivityError("ACTIVITY_NOT_FOUND");
    if (item.ownerId !== actorId) throw new ActivityError("ACTIVITY_FORBIDDEN");
    return item;
  }
  async function attachments(actorId: string, ids: string[]) {
    for (const id of ids)
      if (!(await media?.canAttachPublic(actorId, id)))
        throw new ActivityError("INVALID_ACTIVITY_MEDIA");
  }
  return {
    async cleanupAttachments() {
      if (!media) return;
      for (const job of await repository.retirements()) {
        try {
          await media.retire(job.userId, job.mediaId);
          await repository.finishRetirement(job.mediaId);
        } catch {
          await repository.retryRetirement(job.mediaId);
        }
      }
    },
    read: repository.read,
    list: repository.list,
    reviews: repository.reviews,
    async create(actorId: string, input: unknown) {
      const parsed = activityInputSchema.parse(input);
      const profile = await eligible(actorId);
      validateSchedule(parsed);
      await attachments(actorId, parsed.mediaIds);
      return repository.create(actorId, profile.name, parsed);
    },
    async edit(actorId: string, id: string, input: unknown) {
      const parsed = activityEditSchema.parse(input);
      const item = await owned(actorId, id);
      await eligible(actorId);
      validateSchedule(parsed, item);
      await attachments(actorId, parsed.mediaIds);
      return repository.edit(actorId, id, parsed);
    },
    async cancel(actorId: string, id: string, version: number) {
      await owned(actorId, id);
      return repository.cancel(actorId, id, version);
    },
    async save(actorId: string, id: string, saved: boolean) {
      const item = await repository.read(id);
      if (!item) throw new ActivityError("ACTIVITY_NOT_FOUND");
      if (saved && item.status === "cancelled")
        throw new ActivityError("ACTIVITY_CONFLICT");
      await repository.save(actorId, id, saved);
    },
    async review(actorId: string, id: string, input: unknown) {
      const parsed = activityReviewInputSchema.parse(input);
      const item = await repository.read(id);
      if (!item) throw new ActivityError("ACTIVITY_NOT_FOUND");
      if (!item.startsAt) throw new ActivityError("REVIEWS_NOT_SUPPORTED");
      if (item.status === "cancelled")
        throw new ActivityError("ACTIVITY_CONFLICT");
      const profile = await profiles.read(actorId);
      if (!profile?.name) throw new ActivityError("PROFILE_INCOMPLETE");
      await repository.review(actorId, profile.name, id, parsed);
    },
  };
}
