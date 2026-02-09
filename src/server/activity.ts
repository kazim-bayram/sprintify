import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * Log an activity event on a ticket.
 * Called from tRPC routers when ticket state changes.
 */
export async function logActivity(
  db: PrismaClient,
  params: {
    ticketId: string;
    userId: string;
    type: string;
    data?: Record<string, unknown>;
  }
) {
  return db.activity.create({
    data: {
      ticketId: params.ticketId,
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
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  COMMENT_ADDED: "COMMENT_ADDED",
  COMMENT_UPDATED: "COMMENT_UPDATED",
  COMMENT_DELETED: "COMMENT_DELETED",
  LABEL_ADDED: "LABEL_ADDED",
  LABEL_REMOVED: "LABEL_REMOVED",
  STORY_POINTS_CHANGED: "STORY_POINTS_CHANGED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
  ATTACHMENT_REMOVED: "ATTACHMENT_REMOVED",
  TICKET_ARCHIVED: "TICKET_ARCHIVED",
  TICKET_RESTORED: "TICKET_RESTORED",
} as const;
