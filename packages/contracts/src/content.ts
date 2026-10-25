import { z } from "zod";

/** Gossip's authored label is not a claim of verified geographic position. */
export const gossipPostInputSchema = z
  .object({
    text: z
      .string()
      .refine((value) => value.length <= 280, "Maximum 280 characters."),
    locationLabel: z
      .string()
      .refine((value) => value.length <= 40, "Maximum 40 characters."),
    mediaId: z.string().uuid().toLowerCase().nullable(),
    audience: z.enum(["PUBLIC", "FOLLOWERS_ONLY"]).default("PUBLIC"),
  })
  .strict()
  .refine((input) => Boolean(input.text.trim()) || input.mediaId !== null, {
    message: "A Gossip post requires text or an image.",
  });
export type GossipPostInput = z.infer<typeof gossipPostInputSchema>;

// Author text lifecycle; attachments and audience transitions await D02 decisions.
const textFields = {
  text: z
    .string()
    .refine(
      (value) => value.length <= 280 && Boolean(value.trim()),
      "Text requires 1–280 characters.",
    ),
  locationLabel: z
    .string()
    .refine((value) => value.length <= 40, "Maximum 40 characters."),
};
export const gossipTextInputSchema = z
  .object({
    ...textFields,
    audience: z.enum(["PUBLIC", "FOLLOWERS_ONLY"]).default("PUBLIC"),
  })
  .strict();
export type GossipTextInput = z.infer<typeof gossipTextInputSchema>;
export const contentVersionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const gossipTextEditSchema = z
  .object({ ...textFields, version: z.number().int().positive() })
  .strict();
export type GossipTextEdit = z.infer<typeof gossipTextEditSchema>;
export const gossipTextPostSchema = gossipTextInputSchema
  .extend({
    id: z.string().uuid(),
    authorId: z.string().uuid(),
    version: z.number().int().positive(),
    deletedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type GossipTextPost = z.infer<typeof gossipTextPostSchema>;
export const contentIdSchema = z.string().uuid().toLowerCase();
export const contentCursorSchema = z
  .object({ at: z.string().datetime(), id: contentIdSchema })
  .strict();
export type ContentCursor = z.infer<typeof contentCursorSchema>;
export const contentOwnQuerySchema = z
  .object({
    deleted: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    afterTime: z.string().datetime().optional(),
    afterId: contentIdSchema.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.afterTime) === Boolean(value.afterId));
export const gossipTextPostResponseSchema = z
  .object({ post: gossipTextPostSchema })
  .strict();
export const contentOwnListSchema = z
  .object({
    posts: z.array(gossipTextPostSchema),
    nextCursor: contentCursorSchema.nullable(),
  })
  .strict();
