import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

/**
 * Cascade Engine: Recalculates task schedules based on dependencies.
 * Implements Critical Path Method (CPM) with forward pass.
 */
export async function recalculateSchedule(projectId: string) {
  // Fetch all tasks with dependencies
  const tasks = await db.userStory.findMany({
    where: {
      projectId,
      archivedAt: null,
    },
    include: {
      dependsOn: {
        include: {
          predecessor: {
            select: {
              id: true,
              duration: true,
              constraintType: true,
              constraintDate: true,
              isMilestone: true,
            },
          },
        },
      },
    },
    orderBy: [{ outlineLevel: "asc" }, { position: "asc" }],
  });

  if (tasks.length === 0) return { updated: 0 };

  // Build dependency graph
  const taskMap = new Map(
    tasks.map((t) => [
      t.id,
      {
        id: t.id,
        duration: t.duration,
        constraintType: t.constraintType,
        constraintDate: t.constraintDate,
        predecessors: t.dependsOn.map((d) => ({
          id: d.predecessor.id,
          type: d.type,
          lag: d.lag,
          predDuration: d.predecessor.duration,
          predConstraintType: d.predecessor.constraintType,
          predConstraintDate: d.predecessor.constraintDate,
          predIsMilestone: d.predecessor.isMilestone,
        })),
      },
    ])
  );

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  taskMap.forEach((task) => {
    inDegree.set(task.id, task.predecessors.length);
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);

    // Decrease in-degree for successors
    taskMap.forEach((task) => {
      if (task.predecessors.some((p) => p.id === id)) {
        const current = inDegree.get(task.id) ?? 0;
        inDegree.set(task.id, current - 1);
        if (current - 1 === 0) queue.push(task.id);
      }
    });
  }

  // Forward pass: Calculate Early Start (ES) and Early Finish (EF)
  const ES = new Map<string, Date>();
  const EF = new Map<string, Date>();
  const updates: Array<{ id: string; startDate: Date; endDate: Date }> = [];

  for (const taskId of topoOrder) {
    const task = taskMap.get(taskId);
    if (!task) continue;

    const taskData = tasks.find((t) => t.id === taskId);
    const durationDays = Math.max(task.duration, taskData?.isMilestone ? 0 : 1);

    let earliestStart = new Date(0); // Epoch start

    // Check predecessors
    for (const dep of task.predecessors) {
      const predEF = EF.get(dep.id);
      const predES = ES.get(dep.id);
      if (!predEF || !predES) continue;

      let requiredStart: Date;

      switch (dep.type) {
        case "FS": // Finish-to-Start: successor starts after predecessor finishes + lag
          requiredStart = new Date(predEF);
          requiredStart.setDate(requiredStart.getDate() + dep.lag + 1);
          break;
        case "SS": // Start-to-Start: successor starts when predecessor starts + lag
          requiredStart = new Date(predES);
          requiredStart.setDate(requiredStart.getDate() + dep.lag);
          break;
        case "FF": // Finish-to-Finish: successor finishes when predecessor finishes + lag
          requiredStart = new Date(predEF);
          requiredStart.setDate(requiredStart.getDate() - durationDays + dep.lag);
          break;
        case "SF": // Start-to-Finish: successor finishes when predecessor starts + lag
          requiredStart = new Date(predES);
          requiredStart.setDate(requiredStart.getDate() - durationDays + dep.lag);
          break;
        default:
          continue;
      }

      if (requiredStart > earliestStart) {
        earliestStart = requiredStart;
      }
    }

    // Apply constraints
    if (task.constraintType === "MUST_START_ON" && task.constraintDate) {
      earliestStart = new Date(task.constraintDate);
    } else if (task.constraintType === "START_NO_EARLIER_THAN" && task.constraintDate) {
      const constraintDate = new Date(task.constraintDate);
      if (constraintDate > earliestStart) {
        earliestStart = constraintDate;
      }
    }

    // Ensure start is not before epoch
    if (earliestStart.getTime() === 0) {
      earliestStart = new Date(); // Default to today
    }

    const earliestFinish = new Date(earliestStart);
    earliestFinish.setDate(earliestFinish.getDate() + durationDays);

    ES.set(taskId, earliestStart);
    EF.set(taskId, earliestFinish);

    // Check if update is needed
    const existingTask = tasks.find((t) => t.id === taskId);
    if (existingTask) {
      const existingStart = existingTask.startDate;
      const existingEnd = existingTask.endDate;
      const needsUpdate =
        !existingStart ||
        existingStart.getTime() !== earliestStart.getTime() ||
        !existingEnd ||
        existingEnd.getTime() !== earliestFinish.getTime();

      if (needsUpdate) {
        updates.push({
          id: taskId,
          startDate: earliestStart,
          endDate: earliestFinish,
        });
      }
    } else {
      // New task, always add
      updates.push({
        id: taskId,
        startDate: earliestStart,
        endDate: earliestFinish,
      });
    }
  }

  // Batch update tasks
  let updatedCount = 0;
  for (const update of updates) {
    await db.userStory.update({
      where: { id: update.id },
      data: {
        startDate: update.startDate,
        endDate: update.endDate,
      },
    });
    updatedCount++;
  }

  return { updated: updatedCount, order: topoOrder.length };
}
