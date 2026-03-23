import { z } from 'zod';
import {
  feedbackCategorySchema,
  riskProbabilitySchema,
  riskImpactSchema,
  riskStatusSchema,
  riskSourceSchema,
  riskTriggerTypeSchema,
  riskActionTypeSchema,
} from './enums';

// ─────────────────────────────────────────────
// Risk
// ─────────────────────────────────────────────

export const riskCreateSchema = z.object({
  projectId: z.uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullish(),
  category: feedbackCategorySchema,
  probability: riskProbabilitySchema.default('MEDIUM'),
  impact: riskImpactSchema.default('MEDIUM'),
  status: riskStatusSchema.default('PENDING'),
  source: riskSourceSchema.default('AI_GENERATED'),
  triggerType: riskTriggerTypeSchema.nullish(),
  aiAnalysisId: z.uuid().nullish(),
  createdById: z.uuid().nullish(),
});

export const riskUpdateSchema = riskCreateSchema
  .omit({ projectId: true, source: true, aiAnalysisId: true })
  .partial();

export type RiskCreate = z.infer<typeof riskCreateSchema>;
export type RiskUpdate = z.infer<typeof riskUpdateSchema>;

// ─────────────────────────────────────────────
// RiskAction
// ─────────────────────────────────────────────

export const riskActionCreateSchema = z.object({
  riskId: z.string().uuid(),
  performedById: z.string().uuid(),
  actionType: riskActionTypeSchema,
  comment: z.string().nullish(),
});

export type RiskActionCreate = z.infer<typeof riskActionCreateSchema>;
