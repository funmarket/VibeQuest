import { z } from "zod";
export const businessInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000),
  })
  .strict();
export const businessInviteSchema = z
  .object({ userId: z.string().uuid() })
  .strict();
export const businessAcceptSchema = z.object({}).strict();
export const businessReviewSchema = z
  .object({ decision: z.enum(["approved", "rejected"]) })
  .strict();
export const businessSchema = z
  .object({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    status: z.enum(["pending", "approved", "rejected"]),
    role: z.enum(["owner", "member"]),
    membershipStatus: z.enum(["invited", "active"]),
    canManage: z.boolean(),
    canHostEvents: z.boolean(),
    canAccept: z.boolean(),
  })
  .strict();
export const businessesResponseSchema = z
  .object({ businesses: z.array(businessSchema) })
  .strict();
export const businessResponseSchema = z
  .object({ business: businessSchema })
  .strict();
export type Business = z.infer<typeof businessSchema>;
export type BusinessInput = z.infer<typeof businessInputSchema>;
