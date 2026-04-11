import { z } from 'zod';

// ─────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────

export const teamCreateSchema = z.object({
  name: z.string().min(1).max(255),
});

export const teamUpdateSchema = z.object({
  name: z.string().min(1).max(255),
});

export type TeamCreate = z.infer<typeof teamCreateSchema>;
export type TeamUpdate = z.infer<typeof teamUpdateSchema>;
