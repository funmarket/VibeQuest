import type {
  OfficialEvent,
  EventInput,
  EventEdit,
  EventReviewInput,
  EventReview,
} from "@vq/contracts";
export interface EventsRepository {
  create(
    actorId: string,
    hostName: string,
    input: EventInput,
  ): Promise<OfficialEvent>;
  read(id: string, actorId?: string): Promise<OfficialEvent | null>;
  list(
    tab: "live" | "upcoming",
    offset: number,
    actorId?: string,
  ): Promise<{ events: OfficialEvent[]; nextOffset: number | null }>;
  edit(actorId: string, id: string, input: EventEdit): Promise<OfficialEvent>;
  cancel(actorId: string, id: string, version: number): Promise<OfficialEvent>;
  rsvp(actorId: string, id: string, going: boolean): Promise<void>;
  save(actorId: string, id: string, saved: boolean): Promise<void>;
  review(
    actorId: string,
    author: string,
    id: string,
    input: EventReviewInput,
  ): Promise<void>;
  reviews(
    id: string,
    offset: number,
  ): Promise<{ reviews: EventReview[]; nextOffset: number | null }>;
  retirements(): Promise<{ userId: string; mediaId: string }[]>;
  finishRetirement(id: string): Promise<void>;
  retryRetirement(id: string): Promise<void>;
}
export interface EventHosts {
  hosting(actorId: string, id: string): Promise<{ name: string } | null>;
}
export interface EventProfiles {
  read(actorId: string): Promise<{ name: string } | null>;
}
export interface EventMedia {
  canAttachPublic(actorId: string, id: string): Promise<boolean>;
  retire(actorId: string, id: string): Promise<void>;
}
