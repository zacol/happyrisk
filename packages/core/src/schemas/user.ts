import { z } from 'zod';
import { userRoleSchema } from './enums';

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export const userCreateSchema = z.object({
  email: z.email().max(255),
  name: z.string().max(255).nullish(),
  role: userRoleSchema.optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().max(255).nullish(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const changeRoleSchema = z.object({
  role: userRoleSchema,
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type ChangeRole = z.infer<typeof changeRoleSchema>;
