import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { logActivity, ACTIVITY_TYPES } from "@/server/activity";

export const commentRouter = createTRPCRouter({
  /** List comments for a ticket */
  list: orgProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.ticket.findFirst({
        where: { id: input.ticketId, organizationId: ctx.organization.id },
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.comment.findMany({
        where: { ticketId: input.ticketId },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Create a comment */
  create: orgProcedure
    .input(
      z.object({
        ticketId: z.string(),
        body: z.string().min(1, "Comment cannot be empty").max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN", message: "Viewers cannot comment." });

      const ticket = await ctx.db.ticket.findFirst({
        where: { id: input.ticketId, organizationId: ctx.organization.id },
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const comment = await ctx.db.comment.create({
        data: { body: input.body, ticketId: input.ticketId, userId: ctx.user.id },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      await logActivity(ctx.db, {
        ticketId: input.ticketId,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.COMMENT_ADDED,
      });

      return comment;
    }),

  /** Update a comment (only author) */
  update: orgProcedure
    .input(z.object({ id: z.string(), body: z.string().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({ where: { id: input.id } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own comments." });

      return ctx.db.comment.update({
        where: { id: input.id },
        data: { body: input.body },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
    }),

  /** Delete a comment (author or admin) */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({ where: { id: input.id } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id && ctx.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db.comment.delete({ where: { id: input.id } });

      await logActivity(ctx.db, {
        ticketId: comment.ticketId,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.COMMENT_DELETED,
      });

      return { success: true };
    }),
});
