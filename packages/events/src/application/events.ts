import {
  eventInputSchema,
  eventEditSchema,
  eventReviewInputSchema,
} from "@vq/contracts";
import type {
  EventsRepository,
  EventHosts,
  EventProfiles,
  EventMedia,
} from "../domain/ports";
import { EventError, validateEventSchedule } from "../domain/invariants";
export function createEvents(
  repository: EventsRepository,
  hosts: EventHosts,
  profiles: EventProfiles,
  media?: EventMedia,
) {
  async function read(id: string, actorId?: string) {
    const event = await repository.read(id, actorId);
    if (!event) throw new EventError("EVENT_NOT_FOUND");
    return event;
  }
  async function owner(actorId: string, id: string) {
    const event = await read(id, actorId);
    if (event.ownerId !== actorId) throw new EventError("EVENT_FORBIDDEN");
    return event;
  }
  async function host(actorId: string, businessId: string) {
    const record = await hosts.hosting(actorId, businessId);
    if (!record) throw new EventError("EVENT_FORBIDDEN");
    return record;
  }
  async function attachments(actorId: string, ids: string[]) {
    for (const id of ids)
      if (!(await media?.canAttachPublic(actorId, id)))
        throw new EventError("INVALID_EVENT_MEDIA");
  }
  return {
    read,
    list: repository.list,
    reviews: repository.reviews,
    async create(actorId: string, input: unknown) {
      const parsed = eventInputSchema.parse(input);
      const publisher = await host(actorId, parsed.businessId);
      validateEventSchedule(parsed);
      await attachments(actorId, parsed.mediaIds);
      return repository.create(actorId, publisher.name, parsed);
    },
    async edit(actorId: string, id: string, input: unknown) {
      const parsed = eventEditSchema.parse(input);
      const current = await owner(actorId, id);
      await host(actorId, current.businessId);
      validateEventSchedule(parsed, current);
      await attachments(actorId, parsed.mediaIds);
      return repository.edit(actorId, id, parsed);
    },
    async cancel(actorId: string, id: string, version: number) {
      await owner(actorId, id);
      return repository.cancel(actorId, id, version);
    },
    async rsvp(actorId: string, id: string, going: boolean) {
      const current = await read(id);
      if (going && current.status === "cancelled")
        throw new EventError("EVENT_CONFLICT");
      await repository.rsvp(actorId, id, going);
    },
    async save(actorId: string, id: string, saved: boolean) {
      const current = await read(id);
      if (saved && current.status === "cancelled")
        throw new EventError("EVENT_CONFLICT");
      await repository.save(actorId, id, saved);
    },
    async review(actorId: string, id: string, input: unknown) {
      const parsed = eventReviewInputSchema.parse(input);
      const current = await read(id);
      if (current.status === "cancelled")
        throw new EventError("EVENT_CONFLICT");
      const profile = await profiles.read(actorId);
      if (!profile?.name) throw new EventError("EVENT_PROFILE_REQUIRED");
      await repository.review(actorId, profile.name, id, parsed);
    },
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
  };
}
