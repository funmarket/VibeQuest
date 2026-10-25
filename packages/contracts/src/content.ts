import { z } from "zod";
import { publicProfileSchema } from "./social";
export const gossipEmojis = [
  "✨",
  "☕",
  "🍷",
  "🍕",
  "🔥",
  "⚡",
  "🎧",
  "🎮",
  "💡",
  "🪴",
  "🐾",
  "🌌",
] as const;

/** Gossip's authored label is not a claim of verified geographic position. */
export const gossipPostInputSchema = z
  .object({
    text: z
      .string()
      .refine((value) => value.length <= 280, "Maximum 280 characters."),
    locationLabel: z
      .string()
      .refine((value) => value.length <= 40, "Maximum 40 characters."),
    mediaId: z.string().uuid().toLowerCase().nullable().default(null),
    audience: z.enum(["PUBLIC", "FOLLOWERS_ONLY"]).default("PUBLIC"),
    emoji: z.enum(gossipEmojis).default("✨"),
  })
  .strict()
  .refine((input) => Boolean(input.text.trim()) || input.mediaId !== null, {
    message: "A Gossip post requires text or an image.",
  });
export type GossipPostInput = z.infer<typeof gossipPostInputSchema>;

// Author operations and audience readers share the same canonical post record.
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
export const gossipTextInputSchema = gossipPostInputSchema;
export type GossipTextInput = z.infer<typeof gossipTextInputSchema>;
export const contentVersionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const gossipTextEditSchema = z
  .object({
    ...textFields,
    text: gossipPostInputSchema.shape.text,
    mediaId: z.string().uuid().nullable().optional(),
    audience: z.enum(["PUBLIC", "FOLLOWERS_ONLY"]).optional(),
    emoji: z.enum(gossipEmojis).optional(),
    version: z.number().int().positive(),
  })
  .strict();
export type GossipTextEdit = z.infer<typeof gossipTextEditSchema>;
export const gossipTextPostSchema = z
  .object({
    ...gossipPostInputSchema.shape,
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
export const gossipCommentInputSchema = z
  .object({
    text: z.string().refine((v) => Boolean(v.trim()) && v.length <= 1000),
    parentId: contentIdSchema.nullable().default(null),
  })
  .strict();
export type GossipCommentInput = z.infer<typeof gossipCommentInputSchema>;
export const gossipReactionSchema = z.object({ liked: z.boolean() }).strict();
export const contentPageQuerySchema = z
  .object({
    afterTime: z.string().datetime().optional(),
    afterId: contentIdSchema.optional(),
  })
  .strict()
  .refine((v) => Boolean(v.afterTime) === Boolean(v.afterId));
export const gossipViewSchema = gossipTextPostSchema
  .extend({
    author: publicProfileSchema,
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
    liked: z.boolean(),
  })
  .strict();
export type GossipView = z.infer<typeof gossipViewSchema>;
export const gossipViewResponseSchema = z
  .object({ post: gossipViewSchema })
  .strict();
export const gossipFeedSchema = z
  .object({
    posts: z.array(gossipViewSchema),
    nextCursor: contentCursorSchema.nullable(),
  })
  .strict();
export const gossipCommentSchema = z
  .object({
    id: contentIdSchema,
    postId: contentIdSchema,
    parentId: contentIdSchema.nullable(),
    author: publicProfileSchema.nullable(),
    text: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type GossipComment = z.infer<typeof gossipCommentSchema>;
export const gossipCommentsSchema = z
  .object({
    comments: z.array(gossipCommentSchema),
    nextCursor: contentCursorSchema.nullable(),
  })
  .strict();
export const gossipCommentResponseSchema = z
  .object({ comment: gossipCommentSchema })
  .strict();
export const reportReasonIds = [
  "spam_scam",
  "harassment_bullying",
  "hate_discrimination",
  "threats_violence",
  "sexual_inappropriate",
  "privacy_violation",
  "impersonation",
  "other",
] as const;
export const gossipReportInputSchema = z
  .object({
    reason: z.enum(reportReasonIds),
    details: z
      .string()
      .refine((v) => v.length <= 1000)
      .default(""),
  })
  .strict();
export type GossipReportInput = z.infer<typeof gossipReportInputSchema>;
export const moderationDecisionSchema = z
  .object({
    decision: z.enum(["hide", "remove"]),
    version: z.number().int().positive(),
  })
  .strict();
export type ModerationDecision = z.infer<typeof moderationDecisionSchema>;
export const reportReceiptSchema = z
  .object({
    id: contentIdSchema,
    status: z.enum(["pending", "decided", "expired"]),
    version: z.number().int().positive(),
    submittedAt: z.string().datetime(),
    pendingUntil: z.string().datetime(),
    decidedAt: z.string().datetime().nullable(),
    decision: z.enum(["hide", "remove"]).nullable(),
    evidenceExpiresAt: z.string().datetime(),
  })
  .strict();
export type ReportReceipt = z.infer<typeof reportReceiptSchema>;
export const reportResponseSchema = z
  .object({ report: reportReceiptSchema })
  .strict();
export const moderationCaseSchema = reportReceiptSchema
  .extend({
    reporterId: contentIdSchema.nullable(),
    postId: contentIdSchema,
    targetType: z.enum(["post", "comment"]),
    targetId: contentIdSchema,
  })
  .strict();
export type ModerationCase = z.infer<typeof moderationCaseSchema>;
export const moderationEvidenceSchema = z
  .object({
    post: gossipTextPostSchema.omit({
      mediaId: true,
      deletedAt: true,
      updatedAt: true,
    }),
    comment: z
      .object({
        id: contentIdSchema,
        postId: contentIdSchema,
        authorId: contentIdSchema,
        parentId: contentIdSchema.nullable(),
        text: z.string(),
        createdAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type ModerationEvidence = z.infer<typeof moderationEvidenceSchema>;
export const moderationEvidenceResponseSchema = z
  .object({
    report: moderationCaseSchema,
    reason: z.enum(reportReasonIds),
    details: z.string(),
    evidence: moderationEvidenceSchema,
  })
  .strict();
export const moderationCasesSchema = z
  .object({
    reports: z.array(moderationCaseSchema),
    nextCursor: contentCursorSchema.nullable(),
  })
  .strict();
export const moderationCapabilitySchema = z
  .object({ allowed: z.boolean() })
  .strict();
