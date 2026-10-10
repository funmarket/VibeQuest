import { z } from "zod";
export const uploadInputSchema = z
  .object({ visibility: z.enum(["public", "private"]) })
  .strict();
export const mediaSchema = z
  .object({
    id: z.string().uuid(),
    visibility: z.enum(["public", "private"]),
    status: z.enum(["pending", "processing", "ready", "failed", "deleted"]),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    expiresAt: z.string().datetime(),
  })
  .strict();
export type MediaObject = z.infer<typeof mediaSchema>;
export const mediaResponseSchema = z.object({ media: mediaSchema }).strict();
