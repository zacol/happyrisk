import { z } from 'zod';

import { conversationStatusSchema, surveyFrequencySchema } from './enums';

// ─────────────────────────────────────────────
// SurveyConfig
// ─────────────────────────────────────────────

export const timeUtcSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be in HH:MM format (UTC)');

export const dayOfWeekSchema = z
  .number()
  .int()
  .min(1, 'ISO day must be >= 1 (Monday)')
  .max(7, 'ISO day must be <= 7 (Sunday)');

export const durationDaysSchema = z
  .number()
  .int()
  .min(1, 'Duration must be at least 1 day')
  .max(7, 'Duration cannot exceed 7 days (one week)');

export const surveyConfigCreateSchema = z.object({
  projectId: z.uuid(),
  frequency: surveyFrequencySchema.default('WEEKLY'),
  dayOfWeek: dayOfWeekSchema.default(5),
  timeUtc: timeUtcSchema.default('14:00'),
  duration: durationDaysSchema.default(3),
  isActive: z.boolean().default(true),
});

export const surveyConfigUpdateSchema = surveyConfigCreateSchema
  .omit({ projectId: true })
  .partial();

export type SurveyConfigCreate = z.infer<typeof surveyConfigCreateSchema>;
export type SurveyConfigUpdate = z.infer<typeof surveyConfigUpdateSchema>;

// ─────────────────────────────────────────────
// SurveyResponse (rating)
// ─────────────────────────────────────────────

export const ratingSchema = z
  .number()
  .int()
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

export const surveyResponseCreateSchema = z.object({
  surveyCycleId: z.uuid(),
  projectId: z.uuid(),
  rating: ratingSchema,
  initialComment: z.string().nullish(),
  followUpQuestion: z.string().nullish(),
  followUpAnswer: z.string().nullish(),
  conversationStatus: conversationStatusSchema.default('PARTIAL'),
});

export type SurveyResponseCreate = z.infer<typeof surveyResponseCreateSchema>;
