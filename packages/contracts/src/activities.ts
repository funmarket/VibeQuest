import { z } from "zod";
export const activityInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000),
    location: z.string().trim().min(1).max(200),
    emoji: z.enum(["🎵", "☕", "🎨", "🎸", "🍵", "🌅", "🎭", "🎻", "🧘"]),
    startsAt: z.string().datetime().nullable(),
    mediaIds: z
      .array(z.string().uuid())
      .max(4)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
export const activityEditSchema = activityInputSchema.extend({
  version: z.number().int().positive(),
});
export const activityVersionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const activitySaveSchema = z.object({ saved: z.boolean() }).strict();
export const activityReviewInputSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(1).max(1000),
  })
  .strict();
export const activityQuerySchema = z
  .object({
    tab: z.enum(["live", "upcoming"]).default("live"),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
export const activitySchema = activityInputSchema
  .extend({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    author: z.string(),
    status: z.enum(["live", "upcoming", "cancelled"]),
    version: z.number().int().positive(),
    createdAt: z.string().datetime(),
    saved: z.boolean(),
    reviewCount: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5),
  })
  .strict();
export const activityResponseSchema = z
  .object({ activity: activitySchema })
  .strict();
export const activitiesResponseSchema = z
  .object({
    activities: z.array(activitySchema),
    nextOffset: z.number().int().nullable(),
  })
  .strict();
export const activityReviewSchema = activityReviewInputSchema
  .extend({
    id: z.string().uuid(),
    author: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();
export const activityReviewsResponseSchema = z
  .object({
    reviews: z.array(activityReviewSchema),
    nextOffset: z.number().int().nullable(),
  })
  .strict();
export type ActivityInput = z.infer<typeof activityInputSchema>;
export type ActivityEdit = z.infer<typeof activityEditSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ActivityReviewInput = z.infer<typeof activityReviewInputSchema>;
export type ActivityReview = z.infer<typeof activityReviewSchema>;
