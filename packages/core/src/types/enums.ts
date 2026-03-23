// ─────────────────────────────────────────────
// Auth & Identity
// ─────────────────────────────────────────────

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─────────────────────────────────────────────
// Organization
// ─────────────────────────────────────────────

export const ProjectRole = {
  MEMBER: 'MEMBER',
  LEADER: 'LEADER',
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

// ─────────────────────────────────────────────
// Survey Domain
// ─────────────────────────────────────────────

export const SurveyFrequency = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
} as const;

export type SurveyFrequency = (typeof SurveyFrequency)[keyof typeof SurveyFrequency];

export const SurveyCycleStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

export type SurveyCycleStatus = (typeof SurveyCycleStatus)[keyof typeof SurveyCycleStatus];

export const ParticipationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  RESPONDED: 'RESPONDED',
  EXPIRED: 'EXPIRED',
} as const;

export type ParticipationStatus = (typeof ParticipationStatus)[keyof typeof ParticipationStatus];

export const ConversationStatus = {
  PARTIAL: 'PARTIAL',
  COMPLETE: 'COMPLETE',
} as const;

export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

// ─────────────────────────────────────────────
// AI & Analytics
// ─────────────────────────────────────────────

export const Sentiment = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  NEGATIVE: 'NEGATIVE',
} as const;

export type Sentiment = (typeof Sentiment)[keyof typeof Sentiment];

export const FeedbackCategory = {
  WORKLOAD: 'WORKLOAD',
  COMMUNICATION: 'COMMUNICATION',
  MANAGEMENT: 'MANAGEMENT',
  MEETINGS: 'MEETINGS',
  PRIORITIES: 'PRIORITIES',
  TOOLING: 'TOOLING',
  TEAM_ATMOSPHERE: 'TEAM_ATMOSPHERE',
} as const;

export type FeedbackCategory = (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

// ─────────────────────────────────────────────
// Risk Management
// ─────────────────────────────────────────────

export const RiskProbability = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type RiskProbability = (typeof RiskProbability)[keyof typeof RiskProbability];

export const RiskImpact = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type RiskImpact = (typeof RiskImpact)[keyof typeof RiskImpact];

export const RiskStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  MITIGATED: 'MITIGATED',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type RiskStatus = (typeof RiskStatus)[keyof typeof RiskStatus];

export const RiskSource = {
  AI_GENERATED: 'AI_GENERATED',
  MANUAL: 'MANUAL',
} as const;

export type RiskSource = (typeof RiskSource)[keyof typeof RiskSource];

export const RiskTriggerType = {
  HI_BELOW_THRESHOLD: 'HI_BELOW_THRESHOLD',
  HI_DROP_20_PERCENT: 'HI_DROP_20_PERCENT',
} as const;

export type RiskTriggerType = (typeof RiskTriggerType)[keyof typeof RiskTriggerType];

export const RiskActionType = {
  REVIEWED: 'REVIEWED',
  ADDRESSED: 'ADDRESSED',
  DISMISSED: 'DISMISSED',
} as const;

export type RiskActionType = (typeof RiskActionType)[keyof typeof RiskActionType];
