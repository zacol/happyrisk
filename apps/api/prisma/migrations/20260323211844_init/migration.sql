-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('MEMBER', 'LEADER');

-- CreateEnum
CREATE TYPE "SurveyFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY');

-- CreateEnum
CREATE TYPE "SurveyCycleStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'SENT', 'RESPONDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PARTIAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('WORKLOAD', 'COMMUNICATION', 'MANAGEMENT', 'MEETINGS', 'PRIORITIES', 'TOOLING', 'TEAM_ATMOSPHERE');

-- CreateEnum
CREATE TYPE "RiskProbability" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('PENDING', 'ACTIVE', 'MITIGATED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RiskSource" AS ENUM ('AI_GENERATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "RiskTriggerType" AS ENUM ('HI_BELOW_THRESHOLD', 'HI_DROP_20_PERCENT');

-- CreateEnum
CREATE TYPE "RiskActionType" AS ENUM ('REVIEWED', 'ADDRESSED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hashed_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "department_segment" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slack_workspace_id" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "slack_user_id" VARCHAR(64),
    "project_role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_configs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "frequency" "SurveyFrequency" NOT NULL DEFAULT 'WEEKLY',
    "day_of_week" SMALLINT NOT NULL DEFAULT 5,
    "time_utc" VARCHAR(5) NOT NULL DEFAULT '14:00',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "survey_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_cycles" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "SurveyCycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_participations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "survey_cycle_id" UUID NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMPTZ,
    "responded_at" TIMESTAMPTZ,

    CONSTRAINT "survey_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL,
    "survey_cycle_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "initial_comment" TEXT,
    "follow_up_question" TEXT,
    "follow_up_answer" TEXT,
    "conversation_status" "ConversationStatus" NOT NULL DEFAULT 'PARTIAL',
    "created_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL,
    "survey_response_id" UUID NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "core_issue" VARCHAR(100) NOT NULL,
    "is_project_risk" BOOLEAN NOT NULL DEFAULT false,
    "risk_justification" TEXT,
    "suggestion" TEXT,
    "raw_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "happiness_snapshots" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "survey_cycle_id" UUID NOT NULL,
    "average_rating" DECIMAL(3,2) NOT NULL,
    "response_count" SMALLINT NOT NULL,
    "response_rate" DECIMAL(5,2) NOT NULL,
    "category_breakdown" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "happiness_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" "FeedbackCategory" NOT NULL,
    "probability" "RiskProbability" NOT NULL DEFAULT 'MEDIUM',
    "impact" "RiskImpact" NOT NULL DEFAULT 'MEDIUM',
    "status" "RiskStatus" NOT NULL DEFAULT 'PENDING',
    "source" "RiskSource" NOT NULL DEFAULT 'AI_GENERATED',
    "trigger_type" "RiskTriggerType",
    "ai_analysis_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_actions" (
    "id" UUID NOT NULL,
    "risk_id" UUID NOT NULL,
    "performed_by_id" UUID NOT NULL,
    "action_type" "RiskActionType" NOT NULL,
    "comment" TEXT,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thematic_summaries" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "survey_cycle_id" UUID NOT NULL,
    "summary_text" TEXT NOT NULL,
    "response_count" SMALLINT NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thematic_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_account_id_key" ON "oauth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_hashed_token_key" ON "refresh_tokens"("hashed_token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_hashed_token_idx" ON "refresh_tokens"("hashed_token");

-- CreateIndex
CREATE INDEX "team_memberships_team_id_idx" ON "team_memberships"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_user_id_team_id_key" ON "team_memberships"("user_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slack_workspace_id_key" ON "projects"("slack_workspace_id");

-- CreateIndex
CREATE INDEX "project_memberships_project_id_idx" ON "project_memberships"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_memberships_user_id_project_id_key" ON "project_memberships"("user_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_memberships_project_id_slack_user_id_key" ON "project_memberships"("project_id", "slack_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_configs_project_id_key" ON "survey_configs"("project_id");

-- CreateIndex
CREATE INDEX "survey_cycles_project_id_idx" ON "survey_cycles"("project_id");

-- CreateIndex
CREATE INDEX "survey_cycles_project_id_period_start_idx" ON "survey_cycles"("project_id", "period_start");

-- CreateIndex
CREATE INDEX "survey_participations_survey_cycle_id_idx" ON "survey_participations"("survey_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_participations_user_id_survey_cycle_id_key" ON "survey_participations"("user_id", "survey_cycle_id");

-- CreateIndex
CREATE INDEX "survey_responses_survey_cycle_id_idx" ON "survey_responses"("survey_cycle_id");

-- CreateIndex
CREATE INDEX "survey_responses_project_id_idx" ON "survey_responses"("project_id");

-- CreateIndex
CREATE INDEX "survey_responses_project_id_created_at_idx" ON "survey_responses"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_survey_response_id_key" ON "ai_analyses"("survey_response_id");

-- CreateIndex
CREATE INDEX "ai_analyses_sentiment_idx" ON "ai_analyses"("sentiment");

-- CreateIndex
CREATE INDEX "ai_analyses_category_idx" ON "ai_analyses"("category");

-- CreateIndex
CREATE INDEX "ai_analyses_category_sentiment_idx" ON "ai_analyses"("category", "sentiment");

-- CreateIndex
CREATE INDEX "happiness_snapshots_project_id_idx" ON "happiness_snapshots"("project_id");

-- CreateIndex
CREATE INDEX "happiness_snapshots_project_id_created_at_idx" ON "happiness_snapshots"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "happiness_snapshots_project_id_survey_cycle_id_key" ON "happiness_snapshots"("project_id", "survey_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "risks_ai_analysis_id_key" ON "risks"("ai_analysis_id");

-- CreateIndex
CREATE INDEX "risks_project_id_idx" ON "risks"("project_id");

-- CreateIndex
CREATE INDEX "risks_status_idx" ON "risks"("status");

-- CreateIndex
CREATE INDEX "risks_project_id_status_idx" ON "risks"("project_id", "status");

-- CreateIndex
CREATE INDEX "risk_actions_risk_id_idx" ON "risk_actions"("risk_id");

-- CreateIndex
CREATE UNIQUE INDEX "thematic_summaries_project_id_survey_cycle_id_key" ON "thematic_summaries"("project_id", "survey_cycle_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_configs" ADD CONSTRAINT "survey_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_cycles" ADD CONSTRAINT "survey_cycles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_participations" ADD CONSTRAINT "survey_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_participations" ADD CONSTRAINT "survey_participations_survey_cycle_id_fkey" FOREIGN KEY ("survey_cycle_id") REFERENCES "survey_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_cycle_id_fkey" FOREIGN KEY ("survey_cycle_id") REFERENCES "survey_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_survey_response_id_fkey" FOREIGN KEY ("survey_response_id") REFERENCES "survey_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "happiness_snapshots" ADD CONSTRAINT "happiness_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "happiness_snapshots" ADD CONSTRAINT "happiness_snapshots_survey_cycle_id_fkey" FOREIGN KEY ("survey_cycle_id") REFERENCES "survey_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_ai_analysis_id_fkey" FOREIGN KEY ("ai_analysis_id") REFERENCES "ai_analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_actions" ADD CONSTRAINT "risk_actions_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_actions" ADD CONSTRAINT "risk_actions_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thematic_summaries" ADD CONSTRAINT "thematic_summaries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thematic_summaries" ADD CONSTRAINT "thematic_summaries_survey_cycle_id_fkey" FOREIGN KEY ("survey_cycle_id") REFERENCES "survey_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
