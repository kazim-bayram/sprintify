import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { assertDemoTaskLimit } from "@/server/demo-limits";

export const taskRouter = createTRPCRouter({
  /** List tasks for a user story */
  list: orgProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: { storyId: input.storyId },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      });
    }),

  /** Create a task */
  create: orgProcedure
    .input(z.object({
      storyId: z.string(),
      title: z.string().min(1).max(200),
      assigneeId: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const story = await ctx.db.userStory.findFirst({
        where: { id: input.storyId, organizationId: ctx.organization.id },
        select: { projectId: true },
      });
      if (!story) throw new TRPCError({ code: "NOT_FOUND" });
      await assertDemoTaskLimit(ctx.db, story.projectId);

      const count = await ctx.db.task.count({ where: { storyId: input.storyId } });
      return ctx.db.task.create({
        data: {
          title: input.title,
          storyId: input.storyId,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          position: count,
        },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
      });
    }),

  /** Toggle task completion */
  toggle: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.task.update({
        where: { id: input.id },
        data: { completed: !task.completed },
      });
    }),

  /** Delete a task */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.task.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
