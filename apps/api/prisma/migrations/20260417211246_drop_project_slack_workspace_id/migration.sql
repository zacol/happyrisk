/*
  Warnings:

  - You are about to drop the column `slack_workspace_id` on the `projects` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "projects_slack_workspace_id_key";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "slack_workspace_id";
