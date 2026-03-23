import { z } from 'zod';
import { userRoleSchema } from './enums';

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export const userCreateSchema = z.object({
  email: z.email().max(255),
  name: z.string().max(255).nullish(),
  role: userRoleSchema.default('USER'),
});

export const userUpdateSchema = z.object({
  name: z.string().max(255).nullish(),
  image: z.url().nullish(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
