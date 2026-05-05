-- CreateTable
CREATE TABLE "slack_installations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "workspace_id" VARCHAR(64) NOT NULL,
    "workspace_name" VARCHAR(255),
    "bot_token" TEXT NOT NULL,
    "bot_user_id" VARCHAR(64) NOT NULL,
    "installed_by_id" UUID,
    "installed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slack_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_installations_project_id_key" ON "slack_installations"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "slack_installations_workspace_id_key" ON "slack_installations"("workspace_id");

-- AddForeignKey
ALTER TABLE "slack_installations" ADD CONSTRAINT "slack_installations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_installations" ADD CONSTRAINT "slack_installations_installed_by_id_fkey" FOREIGN KEY ("installed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
