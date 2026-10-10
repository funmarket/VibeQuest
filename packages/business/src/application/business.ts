import {
  businessInputSchema,
  businessInviteSchema,
  businessReviewSchema,
} from "@vq/contracts";
import type {
  BusinessRepository,
  BusinessReviewAuthority,
} from "../domain/ports";
import { permissions, BusinessError } from "../domain/permissions";
export function createBusinesses(
  repository: BusinessRepository,
  authority: BusinessReviewAuthority,
) {
  return {
    async hosting(actorId: string, id: string) {
      const record = await repository.read(actorId, id);
      return record && permissions(record).canHostEvents
        ? { name: record.name }
        : null;
    },
    async create(actorId: string, input: unknown) {
      return permissions(
        await repository.create(actorId, businessInputSchema.parse(input)),
      );
    },
    async mine(actorId: string) {
      return (await repository.mine(actorId)).map(permissions);
    },
    async invite(actorId: string, id: string, input: unknown) {
      const record = await repository.read(actorId, id);
      if (!record || !permissions(record).canManage)
        throw new BusinessError("BUSINESS_FORBIDDEN");
      await repository.invite(
        actorId,
        id,
        businessInviteSchema.parse(input).userId,
      );
    },
    async accept(actorId: string, id: string) {
      return permissions(await repository.accept(actorId, id));
    },
    async review(actorId: string, id: string, input: unknown) {
      if (!(await authority.canReview(actorId)))
        throw new BusinessError("BUSINESS_FORBIDDEN");
      await repository.review(
        actorId,
        id,
        businessReviewSchema.parse(input).decision,
      );
    },
    async canHostEvents(actorId: string, id: string) {
      const record = await repository.read(actorId, id);
      return record ? permissions(record).canHostEvents : false;
    },
  };
}
