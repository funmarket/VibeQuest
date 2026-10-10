import type {
  Activity,
  ActivityInput,
  ActivityEdit,
  ActivityReviewInput,
  ActivityReview,
} from "@vq/contracts";
export interface ActivitiesRepository {
  retirements(): Promise<{ userId: string; mediaId: string }[]>;
  finishRetirement(mediaId: string): Promise<void>;
  retryRetirement(mediaId: string): Promise<void>;
  create(
    actorId: string,
    author: string,
    input: ActivityInput,
  ): Promise<Activity>;
  read(id: string, actorId?: string): Promise<Activity | null>;
  list(
    tab: "live" | "upcoming",
    offset: number,
    actorId?: string,
  ): Promise<{ activities: Activity[]; nextOffset: number | null }>;
  edit(actorId: string, id: string, input: ActivityEdit): Promise<Activity>;
  cancel(actorId: string, id: string, version: number): Promise<Activity>;
  save(actorId: string, id: string, saved: boolean): Promise<void>;
  review(
    actorId: string,
    author: string,
    id: string,
    input: ActivityReviewInput,
  ): Promise<void>;
  reviews(
    id: string,
    offset: number,
  ): Promise<{ reviews: ActivityReview[]; nextOffset: number | null }>;
}
export interface ActivityProfiles {
  read(userId: string): Promise<{ completed: boolean; name: string } | null>;
}
export interface ActivityMedia {
  canAttachPublic(userId: string, id: string): Promise<boolean>;
  retire(userId: string, id: string): Promise<void>;
}
