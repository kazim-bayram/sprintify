import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * Log an activity event on a user story.
 * Called from tRPC routers when story state changes.
 */
export async function logActivity(
  db: PrismaClient,
  params: {
    storyId: string;
    userId: string;
    type: string;
    data?: Record<string, unknown>;
  }
) {
  return db.activity.create({
    data: {
      storyId: params.storyId,
      userId: params.userId,
      type: params.type,
      data: params.data ? (params.data as Prisma.InputJsonValue) : undefined,
    },
  });
}

// Activity types
export const ACTIVITY_TYPES = {
  STATUS_CHANGE: "STATUS_CHANGE",
  PRIORITY_CHANGE: "PRIORITY_CHANGE",
  DEPARTMENT_CHANGE: "DEPARTMENT_CHANGE",
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  COMMENT_ADDED: "COMMENT_ADDED",
  COMMENT_UPDATED: "COMMENT_UPDATED",
  COMMENT_DELETED: "COMMENT_DELETED",
  LABEL_ADDED: "LABEL_ADDED",
  LABEL_REMOVED: "LABEL_REMOVED",
  STORY_POINTS_CHANGED: "STORY_POINTS_CHANGED",
  WSJF_UPDATED: "WSJF_UPDATED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
  ATTACHMENT_REMOVED: "ATTACHMENT_REMOVED",
  STORY_ARCHIVED: "STORY_ARCHIVED",
  STORY_RESTORED: "STORY_RESTORED",
  TASK_COMPLETED: "TASK_COMPLETED",
  CHECKLIST_CHECKED: "CHECKLIST_CHECKED",
  FEATURE_ASSIGNED: "FEATURE_ASSIGNED",
} as const;
