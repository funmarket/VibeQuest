import type { Business, BusinessInput } from "@vq/contracts";
export type BusinessRecord = Omit<
  Business,
  "canManage" | "canHostEvents" | "canAccept"
>;
export interface BusinessRepository {
  create(actorId: string, input: BusinessInput): Promise<BusinessRecord>;
  mine(actorId: string): Promise<BusinessRecord[]>;
  read(actorId: string, id: string): Promise<BusinessRecord | null>;
  invite(actorId: string, id: string, userId: string): Promise<void>;
  accept(actorId: string, id: string): Promise<BusinessRecord>;
  review(
    actorId: string,
    id: string,
    decision: "approved" | "rejected",
  ): Promise<void>;
}
export interface BusinessReviewAuthority {
  canReview(actorId: string): Promise<boolean>;
}
