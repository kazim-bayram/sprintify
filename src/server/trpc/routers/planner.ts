import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

/**
 * Sprint Planner router — bulk operations for the Excel-like planning grid.
 */
export const plannerRouter = createTRPCRouter({
  /** Get all stories + tasks for a project (for the planning grid) */
  getGrid: orgProcedure
    .input(z.object({ projectId: z.string(), sprintId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        projectId: input.projectId,
        organizationId: ctx.organization.id,
        archivedAt: null,
      };
      if (input.sprintId) where.sprintId = input.sprintId;

      const stories = await ctx.db.userStory.findMany({
        where,
        orderBy: { position: "asc" },
        include: {
          feature: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
        },
      });
      return stories;
    }),

  /** Bulk create a story with optional tasks in one go */
  bulkCreateStory: orgProcedure
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1).max(200),
      featureId: z.string().optional(),
      department: z.string().optional(),
      assigneeId: z.string().optional(),
      priority: z.string().default("NONE"),
      sprintId: z.string().optional(),
      storyPoints: z.number().int().nullable().optional(),
      userBusinessValue: z.number().int().min(0).max(10).default(0),
      timeCriticality: z.number().int().min(0).max(10).default(0),
      riskReduction: z.number().int().min(0).max(10).default(0),
      jobSize: z.number().int().min(1).default(1),
      tasks: z.array(z.object({
        title: z.string().min(1).max(200),
        assigneeId: z.string().optional(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.$transaction(async (tx) => {
        const updated = await tx.project.update({
          where: { id: project.id },
          data: { storyCounter: { increment: 1 } },
        });

        const story = await tx.userStory.create({
          data: {
            number: updated.storyCounter,
            title: input.title,
            status: "BACKLOG",
            priority: input.priority,
            department: (input.department as any) ?? null,
            featureId: input.featureId ?? null,
            sprintId: input.sprintId ?? null,
            assigneeId: input.assigneeId ?? null,
            storyPoints: input.storyPoints ?? null,
            userBusinessValue: input.userBusinessValue,
            timeCriticality: input.timeCriticality,
            riskReduction: input.riskReduction,
            jobSize: input.jobSize,
            projectId: project.id,
            reporterId: ctx.user.id,
            organizationId: ctx.organization.id,
          },
        });

        if (input.tasks.length > 0) {
          await tx.task.createMany({
            data: input.tasks.map((t, idx) => ({
              title: t.title,
              position: idx,
              storyId: story.id,
              assigneeId: t.assigneeId ?? null,
            })),
          });
        }

        return story;
      });
    }),

  /** Quick inline update for a story field (debounced from grid) */
  inlineUpdateStory: orgProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      department: z.string().nullable().optional(),
      featureId: z.string().nullable().optional(),
      assigneeId: z.string().nullable().optional(),
      priority: z.string().optional(),
      storyPoints: z.number().int().nullable().optional(),
      userBusinessValue: z.number().int().min(0).max(10).optional(),
      timeCriticality: z.number().int().min(0).max(10).optional(),
      riskReduction: z.number().int().min(0).max(10).optional(),
      jobSize: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, featureId, assigneeId, department, ...rest } = input;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = { ...rest };
      if (department !== undefined) data.department = department;
      if (featureId !== undefined) data.feature = featureId ? { connect: { id: featureId } } : { disconnect: true };
      if (assigneeId !== undefined) data.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
      return ctx.db.userStory.update({ where: { id }, data });
    }),

  /** Add a task to a story inline */
  addTask: orgProcedure
    .input(z.object({
      storyId: z.string(),
      title: z.string().min(1).max(200),
      assigneeId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const count = await ctx.db.task.count({ where: { storyId: input.storyId } });
      return ctx.db.task.create({
        data: {
          title: input.title,
          position: count,
          storyId: input.storyId,
          assigneeId: input.assigneeId ?? null,
        },
      });
    }),

  /** Inline update a task */
  inlineUpdateTask: orgProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      assigneeId: z.string().nullable().optional(),
      completed: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, assigneeId, ...rest } = input;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = { ...rest };
      if (assigneeId !== undefined) data.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
      return ctx.db.task.update({ where: { id }, data });
    }),
});
