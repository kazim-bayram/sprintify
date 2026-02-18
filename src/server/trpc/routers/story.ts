import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { logActivity, ACTIVITY_TYPES } from "@/server/activity";
import { calculateWSJF } from "@/lib/constants";

export const storyRouter = createTRPCRouter({
  /** Get a single user story by ID with all details */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const story = await ctx.db.userStory.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id, archivedAt: null },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
          reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, key: true, methodology: true } },
          feature: { select: { id: true, name: true } },
          column: { select: { id: true, name: true, position: true } },
          labels: { include: { label: true } },
          tasks: {
            include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { position: "asc" },
          },
          checklists: { orderBy: [{ type: "asc" }, { position: "asc" }] },
          comments: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
          },
          activities: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          attachments: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!story) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found." });
      return story;
    }),

  /** Create a new user story */
  create: orgProcedure
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      columnId: z.string().optional(),
      sprintId: z.string().nullable().optional(),
      featureId: z.string().nullable().optional(),
      priority: z.string().default("NONE"),
      department: z.string().nullable().optional(),
      storyPoints: z.number().int().min(0).nullable().optional(),
      assigneeId: z.string().optional(),
      userBusinessValue: z.number().int().min(0).max(10).default(0),
      timeCriticality: z.number().int().min(0).max(10).default(0),
      riskReduction: z.number().int().min(0).max(10).default(0),
      jobSize: z.number().int().min(1).default(1),
      customValues: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        include: { boardColumns: { orderBy: { position: "asc" }, take: 1 } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const targetColumnId = input.columnId ?? project.boardColumns[0]?.id;
      const [updatedProject, storyCount] = await Promise.all([
        ctx.db.project.update({ where: { id: project.id }, data: { storyCounter: { increment: 1 } } }),
        ctx.db.userStory.count({ where: { projectId: project.id, columnId: targetColumnId } }),
      ]);

      const isWaterfall = project.methodology === "WATERFALL";

      const storyPoints = isWaterfall ? null : input.storyPoints ?? null;
      const userBusinessValue = isWaterfall ? 0 : input.userBusinessValue;
      const timeCriticality = isWaterfall ? 0 : input.timeCriticality;
      const riskReduction = isWaterfall ? 0 : input.riskReduction;
      const jobSize = isWaterfall ? 1 : input.jobSize;

      return ctx.db.userStory.create({
        data: {
          number: updatedProject.storyCounter,
          title: input.title,
          description: input.description,
          status: "BACKLOG",
          priority: input.priority,
          department: (input.department as any) ?? null,
          position: storyCount,
          storyPoints,
          userBusinessValue,
          timeCriticality,
          riskReduction,
          jobSize,
          customValues: input.customValues
            ? ((input.customValues as Record<string, unknown>) as any)
            : undefined,
          projectId: project.id,
          featureId: input.featureId ?? null,
          columnId: targetColumnId,
          sprintId: input.sprintId ?? null,
          assigneeId: input.assigneeId,
          reporterId: ctx.user.id,
          organizationId: ctx.organization.id,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
          reporter: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          labels: { include: { label: true } },
        },
      });
    }),

  /** Update a user story with activity logging */
  update: orgProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().nullable().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      department: z.string().nullable().optional(),
      columnId: z.string().optional(),
      position: z.number().int().min(0).optional(),
      assigneeId: z.string().nullable().optional(),
      sprintId: z.string().nullable().optional(),
      featureId: z.string().nullable().optional(),
      storyPoints: z.number().int().min(0).nullable().optional(),
      userBusinessValue: z.number().int().min(0).max(10).optional(),
      timeCriticality: z.number().int().min(0).max(10).optional(),
      riskReduction: z.number().int().min(0).max(10).optional(),
      jobSize: z.number().int().min(1).optional(),
      customValues: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const { id, columnId, assigneeId, sprintId, featureId, department, customValues, ...rest } = input;
      const story = await ctx.db.userStory.findFirst({
        where: { id, organizationId: ctx.organization.id },
        include: { project: { select: { methodology: true } } },
      });
      if (!story) throw new TRPCError({ code: "NOT_FOUND" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...rest };

      if (department !== undefined) updateData.department = department;
      if (customValues !== undefined) updateData.customValues = customValues as any;
      if (columnId !== undefined) updateData.column = columnId ? { connect: { id: columnId } } : { disconnect: true };
      if (assigneeId !== undefined) updateData.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
      if (sprintId !== undefined) updateData.sprint = sprintId ? { connect: { id: sprintId } } : { disconnect: true };
      if (featureId !== undefined) updateData.feature = featureId ? { connect: { id: featureId } } : { disconnect: true };

      if (story.project.methodology === "WATERFALL") {
        // Enforce Waterfall semantics on WSJF / points regardless of client input
        updateData.storyPoints = null;
        updateData.userBusinessValue = 0;
        updateData.timeCriticality = 0;
        updateData.riskReduction = 0;
        updateData.jobSize = 1;
      }

      const updated = await ctx.db.userStory.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
          labels: { include: { label: true } },
        },
      });

      // Log activities
      const activities: Promise<unknown>[] = [];
      if (input.status && input.status !== story.status) {
        activities.push(logActivity(ctx.db, { storyId: id, userId: ctx.user.id, type: ACTIVITY_TYPES.STATUS_CHANGE, data: { from: story.status, to: input.status } }));
      }
      if (input.priority && input.priority !== story.priority) {
        activities.push(logActivity(ctx.db, { storyId: id, userId: ctx.user.id, type: ACTIVITY_TYPES.PRIORITY_CHANGE, data: { from: story.priority, to: input.priority } }));
      }
      if (assigneeId !== undefined && assigneeId !== story.assigneeId) {
        activities.push(logActivity(ctx.db, { storyId: id, userId: ctx.user.id, type: assigneeId ? ACTIVITY_TYPES.ASSIGNED : ACTIVITY_TYPES.UNASSIGNED, data: { assigneeId } }));
      }
      if (input.userBusinessValue !== undefined || input.timeCriticality !== undefined || input.riskReduction !== undefined || input.jobSize !== undefined) {
        activities.push(logActivity(ctx.db, { storyId: id, userId: ctx.user.id, type: ACTIVITY_TYPES.WSJF_UPDATED }));
      }
      await Promise.all(activities);
      return updated;
    }),

  /** Move a story between columns (drag & drop) */
  move: orgProcedure
    .input(z.object({ storyId: z.string(), targetColumnId: z.string(), targetPosition: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const story = await ctx.db.userStory.findFirst({
        where: { id: input.storyId, organizationId: ctx.organization.id },
        include: { column: true },
      });
      if (!story) throw new TRPCError({ code: "NOT_FOUND" });

      const targetColumn = await ctx.db.boardColumn.findUnique({ where: { id: input.targetColumnId } });
      if (!targetColumn) throw new TRPCError({ code: "NOT_FOUND", message: "Target column not found." });

      // WIP Limit Guard: Block move if target column is at capacity
      if (targetColumn.wipLimit != null) {
        const currentCount = await ctx.db.userStory.count({
          where: { columnId: input.targetColumnId, archivedAt: null },
        });
        // Don't count if re-ordering within the same column
        const isMovingToNewColumn = story.columnId !== input.targetColumnId;
        if (isMovingToNewColumn && currentCount >= targetColumn.wipLimit) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `WIP Limit Reached! "${targetColumn.name}" has a limit of ${targetColumn.wipLimit}. Finish existing work first.`,
          });
        }
      }

      // Quality Gate: Block move to Done-type column if DoD items unchecked
      if (targetColumn.colType === "DONE") {
        const dodItems = await ctx.db.checklistItem.findMany({
          where: { storyId: input.storyId, type: "DOD" },
        });
        const unchecked = dodItems.filter((i) => !i.checked);
        if (unchecked.length > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Cannot move to Done: ${unchecked.length} Definition of Done item(s) not completed.`,
          });
        }
      }

      const updated = await ctx.db.userStory.update({
        where: { id: input.storyId },
        data: { columnId: input.targetColumnId, position: input.targetPosition },
      });

      if (story.columnId !== input.targetColumnId && targetColumn) {
        await logActivity(ctx.db, { storyId: input.storyId, userId: ctx.user.id, type: ACTIVITY_TYPES.STATUS_CHANGE, data: { from: story.column?.name, to: targetColumn.name } });
      }
      return updated;
    }),

  /** Soft-delete (archive) a story */
  archive: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const story = await ctx.db.userStory.findFirst({ where: { id: input.id, organizationId: ctx.organization.id } });
      if (!story) throw new TRPCError({ code: "NOT_FOUND" });
      await logActivity(ctx.db, { storyId: input.id, userId: ctx.user.id, type: ACTIVITY_TYPES.STORY_ARCHIVED });
      return ctx.db.userStory.update({ where: { id: input.id }, data: { archivedAt: new Date() } });
    }),

  /** Restore an archived story */
  restore: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      await logActivity(ctx.db, { storyId: input.id, userId: ctx.user.id, type: ACTIVITY_TYPES.STORY_RESTORED });
      return ctx.db.userStory.update({ where: { id: input.id }, data: { archivedAt: null } });
    }),
});
