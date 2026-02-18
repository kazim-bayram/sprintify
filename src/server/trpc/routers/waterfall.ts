import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { recalculateSchedule } from "@/server/waterfall/schedule-engine";

export const waterfallRouter = createTRPCRouter({
  /** Recalculate schedule for all tasks in a project (Cascade Engine) */
  recalculateSchedule: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true, methodology: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.methodology === "AGILE") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Schedule recalculation is only available for Waterfall and Hybrid projects.",
        });
      }

      const result = await recalculateSchedule(input.projectId);
      return result;
    }),

  /** Save baseline (copy current dates to baseline fields) */
  saveBaseline: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const tasks = await ctx.db.userStory.findMany({
        where: { projectId: input.projectId, archivedAt: null },
        select: { id: true, startDate: true, endDate: true },
      });

      await ctx.db.$transaction(
        tasks.map((task) =>
          ctx.db.userStory.update({
            where: { id: task.id },
            data: {
              baselineStartDate: task.startDate,
              baselineEndDate: task.endDate,
            },
          })
        )
      );

      return { saved: tasks.length };
    }),

  /** Update task hierarchy (indent/outdent) */
  updateHierarchy: orgProcedure
    .input(
      z.object({
        taskId: z.string(),
        parentStoryId: z.string().nullable().optional(),
        outlineLevel: z.number().int().min(1),
        wbsIndex: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const task = await ctx.db.userStory.findFirst({
        where: { id: input.taskId, organizationId: ctx.organization.id },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: any = {
        outlineLevel: input.outlineLevel,
      };
      if (input.parentStoryId !== undefined) {
        updateData.parentStoryId = input.parentStoryId;
      }
      if (input.wbsIndex !== undefined) {
        updateData.wbsIndex = input.wbsIndex;
      }

      return ctx.db.userStory.update({
        where: { id: input.taskId },
        data: updateData,
      });
    }),

  /** Create dependency between tasks */
  createDependency: orgProcedure
    .input(
      z.object({
        predecessorId: z.string(),
        successorId: z.string(),
        type: z.enum(["FS", "SS", "FF", "SF"]).default("FS"),
        lag: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      if (input.predecessorId === input.successorId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A task cannot depend on itself." });
      }

      const [pred, succ] = await Promise.all([
        ctx.db.userStory.findFirst({
          where: { id: input.predecessorId, organizationId: ctx.organization.id },
        }),
        ctx.db.userStory.findFirst({
          where: { id: input.successorId, organizationId: ctx.organization.id },
        }),
      ]);

      if (!pred || !succ) throw new TRPCError({ code: "NOT_FOUND" });
      if (pred.projectId !== succ.projectId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tasks must be in the same project." });
      }

      await ctx.db.storyDependency.create({
        data: {
          predecessorId: input.predecessorId,
          successorId: input.successorId,
          type: input.type,
          lag: input.lag,
        },
      });

      return { success: true };
    }),
});
