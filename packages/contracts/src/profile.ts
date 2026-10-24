import { z } from "zod";
export const profileInterestPresets = [
  "cyberpunk",
  "web3",
  "solana",
  "neon",
  "tokyo",
  "tunis",
  "coffee-seeker",
  "retro-gaming",
  "cultural-pass",
  "minimalist",
] as const;
export const interestSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/\s+/g, "-"))
  .pipe(z.string().min(1).max(64));
const socialHandle = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .regex(/^[a-zA-Z0-9_]*$/)
      .max(32),
  );
const personalFields = {
  interests: z
    .array(interestSchema)
    .max(50)
    .transform((values) => [...new Set(values)]),
  location: z.string().trim().max(200),
  contactMethod: z.enum(["telegram", "x", "email"]),
  contactEmail: z.union([z.literal(""), z.email().max(254)]),
  phoneNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^(?:\+?[0-9 ()-]{3,40})?$/),
  xHandle: socialHandle,
  telegramHandle: socialHandle,
  cozyDiary: z.boolean(),
};
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
    interests: personalFields.interests.optional(),
    location: personalFields.location.optional(),
    contactMethod: personalFields.contactMethod.optional(),
    contactEmail: personalFields.contactEmail.optional(),
    phoneNumber: personalFields.phoneNumber.optional(),
    xHandle: personalFields.xHandle.optional(),
    telegramHandle: personalFields.telegramHandle.optional(),
    cozyDiary: personalFields.cozyDiary.optional(),
  })
  .strict();
export type ProfileInput = z.infer<typeof profileInputSchema>;
export const profileSchema = profileInputSchema
  .extend({
    ...personalFields,
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
export const handleAvailabilityQuerySchema = z
  .object({
    handle: profileInputSchema.shape.handle.unwrap(),
  })
  .strict();
export const handleAvailabilityResponseSchema = z
  .object({ available: z.boolean() })
  .strict();
