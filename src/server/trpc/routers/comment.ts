import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { logActivity, ACTIVITY_TYPES } from "@/server/activity";

export const commentRouter = createTRPCRouter({
  list: orgProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { storyId: input.storyId },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: orgProcedure
    .input(z.object({ storyId: z.string(), body: z.string().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const comment = await ctx.db.comment.create({
        data: { body: input.body, storyId: input.storyId, userId: ctx.user.id },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      });
      await logActivity(ctx.db, { storyId: input.storyId, userId: ctx.user.id, type: ACTIVITY_TYPES.COMMENT_ADDED });
      return comment;
    }),

  update: orgProcedure
    .input(z.object({ id: z.string(), body: z.string().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({ where: { id: input.id } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.comment.update({
        where: { id: input.id }, data: { body: input.body },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({ where: { id: input.id } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id && ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.comment.delete({ where: { id: input.id } });
      await logActivity(ctx.db, { storyId: comment.storyId, userId: ctx.user.id, type: ACTIVITY_TYPES.COMMENT_DELETED });
      return { success: true };
    }),
});
