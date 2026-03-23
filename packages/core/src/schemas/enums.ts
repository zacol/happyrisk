import { z } from 'zod';

// ─────────────────────────────────────────────
// Auth & Identity
// ─────────────────────────────────────────────

export const userRoleSchema = z.enum(['USER', 'ADMIN']);

// ─────────────────────────────────────────────
// Organization
// ─────────────────────────────────────────────

export const projectRoleSchema = z.enum(['MEMBER', 'LEADER']);

// ─────────────────────────────────────────────
// Survey Domain
// ─────────────────────────────────────────────

export const surveyFrequencySchema = z.enum(['WEEKLY', 'BIWEEKLY']);

export const surveyCycleStatusSchema = z.enum(['ACTIVE', 'COMPLETED']);

export const participationStatusSchema = z.enum(['PENDING', 'SENT', 'RESPONDED', 'EXPIRED']);

export const conversationStatusSchema = z.enum(['PARTIAL', 'COMPLETE']);

// ─────────────────────────────────────────────
// AI & Analytics
// ─────────────────────────────────────────────

export const sentimentSchema = z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']);

export const feedbackCategorySchema = z.enum([
  'WORKLOAD',
  'COMMUNICATION',
  'MANAGEMENT',
  'MEETINGS',
  'PRIORITIES',
  'TOOLING',
  'TEAM_ATMOSPHERE',
]);

// ─────────────────────────────────────────────
// Risk Management
// ─────────────────────────────────────────────

export const riskProbabilitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const riskImpactSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const riskStatusSchema = z.enum(['PENDING', 'ACTIVE', 'MITIGATED', 'RESOLVED', 'DISMISSED']);

export const riskSourceSchema = z.enum(['AI_GENERATED', 'MANUAL']);

export const riskTriggerTypeSchema = z.enum(['HI_BELOW_THRESHOLD', 'HI_DROP_20_PERCENT']);

export const riskActionTypeSchema = z.enum(['REVIEWED', 'ADDRESSED', 'DISMISSED']);
