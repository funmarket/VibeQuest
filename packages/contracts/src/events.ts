import { z } from "zod";
export const eventInputSchema = z
  .object({
    businessId: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000),
    location: z.string().trim().min(1).max(200),
    tag: z.enum(["music", "art", "cafe", "theatre"]),
    startsAt: z.string().datetime().nullable(),
    mediaIds: z
      .array(z.string().uuid())
      .max(4)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
export const eventEditSchema = eventInputSchema.extend({
  version: z.number().int().positive(),
});
export const eventVersionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const eventRsvpSchema = z.object({ going: z.boolean() }).strict();
export const eventSaveSchema = z.object({ saved: z.boolean() }).strict();
export const eventReviewInputSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(1).max(1000),
  })
  .strict();
export const eventQuerySchema = z
  .object({
    tab: z.enum(["live", "upcoming"]).default("live"),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
export const eventSchema = eventInputSchema
  .extend({
    id: z.string().uuid(),
    ownerId: z.string().uuid(),
    hostName: z.string(),
    status: z.enum(["live", "upcoming", "cancelled"]),
    version: z.number().int().positive(),
    createdAt: z.string().datetime(),
    going: z.boolean(),
    saved: z.boolean(),
    rsvpCount: z.number().int().nonnegative(),
    reviewCount: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5),
  })
  .strict();
export const eventResponseSchema = z.object({ event: eventSchema }).strict();
export const eventsResponseSchema = z
  .object({
    events: z.array(eventSchema),
    nextOffset: z.number().int().nullable(),
  })
  .strict();
export const eventReviewSchema = eventReviewInputSchema
  .extend({
    id: z.string().uuid(),
    author: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();
export const eventReviewsResponseSchema = z
  .object({
    reviews: z.array(eventReviewSchema),
    nextOffset: z.number().int().nullable(),
  })
  .strict();
export type OfficialEvent = z.infer<typeof eventSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
export type EventEdit = z.infer<typeof eventEditSchema>;
export type EventReviewInput = z.infer<typeof eventReviewInputSchema>;
export type EventReview = z.infer<typeof eventReviewSchema>;
