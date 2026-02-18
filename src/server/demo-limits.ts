import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const DEMO_TASK_LIMIT = 30;
const DEMO_LIMIT_MESSAGE =
  "Demo Limit Reached. Please sign up for the full version to add more.";

/**
 * If the project is a demo and already has at least DEMO_TASK_LIMIT tasks, throws.
 * Call before createTicket (story) or createPhase or createTask.
 */
export async function assertDemoTaskLimit(
  db: PrismaClient,
  projectId: string
): Promise<void> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { isDemo: true },
  });

  if (!project?.isDemo) return;

  const taskCount = await db.task.count({
    where: {
      story: { projectId },
    },
  });

  if (taskCount >= DEMO_TASK_LIMIT) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: DEMO_LIMIT_MESSAGE,
    });
  }
}

/**
 * For phase create: demos are limited to 4 phases. If project is demo and already has 4 phases, throws.
 */
export async function assertDemoPhaseLimit(
  db: PrismaClient,
  projectId: string
): Promise<void> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { isDemo: true },
  });

  if (!project?.isDemo) return;

  const phaseCount = await db.phase.count({
    where: { projectId },
  });

  if (phaseCount >= 4) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: DEMO_LIMIT_MESSAGE,
    });
  }
}
