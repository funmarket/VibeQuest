import { z } from "zod";
export const publicProfileSchema = z
  .object({
    id: z.string().uuid().toLowerCase(),
    handle: z.string().nullable(),
    name: z.string(),
    bio: z.string(),
  })
  .strict();
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export const publicProfileResponseSchema = z
  .object({ profile: publicProfileSchema })
  .strict();
export const followInputSchema = z.object({ following: z.boolean() }).strict();
export const socialCursorSchema = z
  .object({ at: z.string().datetime(), id: z.string().uuid() })
  .strict();
export type SocialCursor = z.infer<typeof socialCursorSchema>;
export const socialQuerySchema = z
  .object({
    side: z.enum(["following", "followers"]),
    afterTime: z.string().datetime().optional(),
    afterId: z.string().uuid().optional(),
  })
  .strict()
  .refine((q) => Boolean(q.afterTime) === Boolean(q.afterId));
export const socialCountsSchema = z
  .object({
    following: z.number().int().nonnegative(),
    followers: z.number().int().nonnegative(),
  })
  .strict();
export const relationshipSchema = z
  .object({
    following: z.boolean(),
    followedBy: z.boolean(),
    mutual: z.boolean(),
  })
  .strict();
export type Relationship = z.infer<typeof relationshipSchema>;
export const socialStateSchema = relationshipSchema
  .extend({ counts: socialCountsSchema })
  .strict();
export const socialPersonSchema = z
  .object({ profile: publicProfileSchema, relationship: relationshipSchema })
  .strict();
export type SocialPerson = z.infer<typeof socialPersonSchema>;
export const socialListSchema = z
  .object({
    people: z.array(socialPersonSchema),
    counts: socialCountsSchema,
    nextCursor: socialCursorSchema.nullable(),
  })
  .strict();
