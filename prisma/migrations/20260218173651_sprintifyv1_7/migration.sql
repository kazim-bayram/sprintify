-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('MARKETING', 'R_AND_D', 'PACKAGING', 'QUALITY', 'SUPPLY_CHAIN', 'FINANCE');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgramHealth" AS ENUM ('ON_TRACK', 'AT_RISK', 'OFF_TRACK');

-- CreateEnum
CREATE TYPE "StrategicLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Methodology" AS ENUM ('AGILE', 'WATERFALL', 'HYBRID');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'DATE', 'USER');

-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('BACKLOG', 'TODO', 'DOING', 'DONE');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('GLOBAL_PRODUCT_BACKLOG', 'SPRINT_BOARD');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('FS', 'SS', 'FF', 'SF');

-- CreateEnum
CREATE TYPE "ConstraintType" AS ENUM ('ASAP', 'ALAP', 'MUST_START_ON', 'MUST_FINISH_ON', 'START_NO_EARLIER_THAN', 'FINISH_NO_EARLIER_THAN');

-- CreateEnum
CREATE TYPE "ChecklistType" AS ENUM ('DOR', 'DOD');

-- CreateEnum
CREATE TYPE "EstimationStatus" AS ENUM ('WAITING', 'VOTING', 'REVEALED');

-- CreateEnum
CREATE TYPE "VotingType" AS ENUM ('EFFORT', 'VALUE', 'TIME', 'RISK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabase_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "department" "Department",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "join_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_labels" (
    "story_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "story_labels_pkey" PRIMARY KEY ("story_id","label_id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'PLANNED',
    "health" "ProgramHealth" NOT NULL DEFAULT 'ON_TRACK',
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strategic_goal" TEXT,
    "owner_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "methodology" "Methodology" NOT NULL DEFAULT 'AGILE',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "program_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "story_counter" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "idea_id" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "businessCase" TEXT,
    "expected_roi" DOUBLE PRECISION,
    "strategic_alignment" "StrategicLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "IdeaStatus" NOT NULL DEFAULT 'DRAFT',
    "swot_analysis" JSONB,
    "organization_id" TEXT NOT NULL,
    "linked_project_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "position" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "project_id" TEXT NOT NULL,
    "is_gate" BOOLEAN NOT NULL DEFAULT false,
    "gate_approver_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_dependencies" (
    "predecessor_id" TEXT NOT NULL,
    "successor_id" TEXT NOT NULL,

    CONSTRAINT "phase_dependencies_pkey" PRIMARY KEY ("predecessor_id","successor_id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_columns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "wip_limit" INTEGER,
    "col_type" "ColumnType" NOT NULL DEFAULT 'TODO',
    "board_type" "BoardType" NOT NULL DEFAULT 'SPRINT_BOARD',
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "project_id" TEXT NOT NULL,
    "phase_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "completed_points" INTEGER NOT NULL DEFAULT 0,
    "total_value" INTEGER NOT NULL DEFAULT 0,
    "completed_value" INTEGER NOT NULL DEFAULT 0,
    "sprint_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stories" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "priority" TEXT NOT NULL DEFAULT 'NONE',
    "department" "Department",
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "constraint_type" "ConstraintType" NOT NULL DEFAULT 'ASAP',
    "constraint_date" TIMESTAMP(3),
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "outline_level" INTEGER NOT NULL DEFAULT 1,
    "wbs_index" TEXT,
    "parent_story_id" TEXT,
    "baseline_start_date" TIMESTAMP(3),
    "baseline_end_date" TIMESTAMP(3),
    "user_business_value" INTEGER NOT NULL DEFAULT 0,
    "time_criticality" INTEGER NOT NULL DEFAULT 0,
    "risk_reduction" INTEGER NOT NULL DEFAULT 0,
    "job_size" INTEGER NOT NULL DEFAULT 1,
    "story_points" INTEGER,
    "metadata" JSONB,
    "custom_values" JSONB,
    "project_id" TEXT NOT NULL,
    "feature_id" TEXT,
    "phase_id" TEXT,
    "column_id" TEXT,
    "sprint_id" TEXT,
    "assignee_id" TEXT,
    "reporter_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "user_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_dependencies" (
    "predecessor_id" TEXT NOT NULL,
    "successor_id" TEXT NOT NULL,
    "type" "DependencyType" NOT NULL DEFAULT 'FS',
    "lag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "story_dependencies_pkey" PRIMARY KEY ("predecessor_id","successor_id")
);

-- CreateTable
CREATE TABLE "project_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "methodology" "Methodology" NOT NULL DEFAULT 'WATERFALL',
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isGate" BOOLEAN NOT NULL DEFAULT false,
    "template_id" TEXT NOT NULL,

    CONSTRAINT "template_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "phase_id" TEXT NOT NULL,

    CONSTRAINT "template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "story_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "type" "ChecklistType" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "story_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Estimation Session',
    "access_code" TEXT NOT NULL,
    "status" "EstimationStatus" NOT NULL DEFAULT 'WAITING',
    "votingType" "VotingType" NOT NULL DEFAULT 'EFFORT',
    "active_story_id" TEXT,
    "project_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "guest_id" TEXT,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_votes" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_join_code_key" ON "organizations"("join_code");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "labels_organization_id_name_key" ON "labels"("organization_id", "name");

-- CreateIndex
CREATE INDEX "programs_organization_id_idx" ON "programs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_idea_id_key" ON "projects"("idea_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_key_key" ON "projects"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ideas_linked_project_id_key" ON "ideas"("linked_project_id");

-- CreateIndex
CREATE INDEX "ideas_organization_id_idx" ON "ideas"("organization_id");

-- CreateIndex
CREATE INDEX "phases_project_id_idx" ON "phases"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "field_definitions_organization_id_field_key_key" ON "field_definitions"("organization_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "board_columns_project_id_board_type_position_key" ON "board_columns"("project_id", "board_type", "position");

-- CreateIndex
CREATE INDEX "sprints_project_id_status_idx" ON "sprints"("project_id", "status");

-- CreateIndex
CREATE INDEX "sprints_organization_id_idx" ON "sprints"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_snapshots_sprint_id_date_key" ON "sprint_snapshots"("sprint_id", "date");

-- CreateIndex
CREATE INDEX "user_stories_organization_id_idx" ON "user_stories"("organization_id");

-- CreateIndex
CREATE INDEX "user_stories_project_id_column_id_idx" ON "user_stories"("project_id", "column_id");

-- CreateIndex
CREATE INDEX "user_stories_assignee_id_idx" ON "user_stories"("assignee_id");

-- CreateIndex
CREATE INDEX "user_stories_sprint_id_idx" ON "user_stories"("sprint_id");

-- CreateIndex
CREATE INDEX "user_stories_feature_id_idx" ON "user_stories"("feature_id");

-- CreateIndex
CREATE INDEX "user_stories_phase_id_idx" ON "user_stories"("phase_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_stories_project_id_number_key" ON "user_stories"("project_id", "number");

-- CreateIndex
CREATE INDEX "project_templates_organization_id_idx" ON "project_templates"("organization_id");

-- CreateIndex
CREATE INDEX "template_phases_template_id_idx" ON "template_phases"("template_id");

-- CreateIndex
CREATE INDEX "template_tasks_phase_id_idx" ON "template_tasks"("phase_id");

-- CreateIndex
CREATE INDEX "activities_story_id_idx" ON "activities"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_sessions_access_code_key" ON "estimation_sessions"("access_code");

-- CreateIndex
CREATE INDEX "estimation_sessions_access_code_idx" ON "estimation_sessions"("access_code");

-- CreateIndex
CREATE INDEX "estimation_sessions_project_id_idx" ON "estimation_sessions"("project_id");

-- CreateIndex
CREATE INDEX "estimation_participants_session_id_idx" ON "estimation_participants"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_participants_session_id_guest_id_key" ON "estimation_participants"("session_id", "guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_votes_participant_id_session_id_story_id_key" ON "estimation_votes"("participant_id", "session_id", "story_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_labels" ADD CONSTRAINT "story_labels_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_labels" ADD CONSTRAINT "story_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_linked_project_id_fkey" FOREIGN KEY ("linked_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_dependencies" ADD CONSTRAINT "phase_dependencies_predecessor_id_fkey" FOREIGN KEY ("predecessor_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_dependencies" ADD CONSTRAINT "phase_dependencies_successor_id_fkey" FOREIGN KEY ("successor_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_snapshots" ADD CONSTRAINT "sprint_snapshots_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "board_columns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_parent_story_id_fkey" FOREIGN KEY ("parent_story_id") REFERENCES "user_stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_dependencies" ADD CONSTRAINT "story_dependencies_predecessor_id_fkey" FOREIGN KEY ("predecessor_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_dependencies" ADD CONSTRAINT "story_dependencies_successor_id_fkey" FOREIGN KEY ("successor_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_phases" ADD CONSTRAINT "template_phases_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tasks" ADD CONSTRAINT "template_tasks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "template_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_participants" ADD CONSTRAINT "estimation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_participants" ADD CONSTRAINT "estimation_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "estimation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_votes" ADD CONSTRAINT "estimation_votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "estimation_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_votes" ADD CONSTRAINT "estimation_votes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "estimation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_votes" ADD CONSTRAINT "estimation_votes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
