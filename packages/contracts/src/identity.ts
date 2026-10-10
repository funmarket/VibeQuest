import { z } from "zod";

export const credentialsSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(12).max(128),
  })
  .strict();
export const accountSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    emailVerified: z.boolean(),
  })
  .strict();
export type Account = z.infer<typeof accountSchema>;
export const accountResponseSchema = z
  .object({ account: accountSchema.nullable() })
  .strict();
export type AccountResponse = z.infer<typeof accountResponseSchema>;
