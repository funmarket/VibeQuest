import { z } from "zod";
export const profileInputSchema = z
  .object({
    name: z.string().trim().max(80),
    bio: z.string().trim().max(1000),
    handle: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{3,30}$/)
      .nullable(),
    favoriteVibe: z.string().trim().min(1).max(32),
    version: z.number().int().min(0),
  })
  .strict();
export type ProfileInput = z.infer<typeof profileInputSchema>;
export const profileSchema = profileInputSchema
  .extend({
    userId: z.string().uuid(),
    version: z.number().int().positive(),
    completed: z.boolean(),
    photoMediaId: z.string().uuid().nullable(),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
export const profilePhotoInputSchema = z
  .object({
    mediaId: z.string().uuid().nullable(),
    version: z.number().int().positive(),
  })
  .strict();
export const profileResponseSchema = z
  .object({ profile: profileSchema.nullable() })
  .strict();
