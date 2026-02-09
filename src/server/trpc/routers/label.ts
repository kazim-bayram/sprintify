import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { logActivity, ACTIVITY_TYPES } from "@/server/activity";

export const labelRouter = createTRPCRouter({
  /** List all labels for the organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.label.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { name: "asc" },
    });
  }),

  /** Create a new label */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(30),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color")
          .default("#6B7280"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.label.findUnique({
        where: {
          organizationId_name: { organizationId: ctx.organization.id, name: input.name },
        },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Label already exists." });

      return ctx.db.label.create({
        data: { name: input.name, color: input.color, organizationId: ctx.organization.id },
      });
    }),

  /** Delete a label */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete labels." });

      await ctx.db.label.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Add a label to a ticket */
  addToTicket: orgProcedure
    .input(z.object({ ticketId: z.string(), labelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const label = await ctx.db.label.findFirst({
        where: { id: input.labelId, organizationId: ctx.organization.id },
      });
      if (!label) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.ticketLabel.create({
        data: { ticketId: input.ticketId, labelId: input.labelId },
      });

      await logActivity(ctx.db, {
        ticketId: input.ticketId,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.LABEL_ADDED,
        data: { labelName: label.name },
      });

      return { success: true };
    }),

  /** Remove a label from a ticket */
  removeFromTicket: orgProcedure
    .input(z.object({ ticketId: z.string(), labelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const label = await ctx.db.label.findFirst({
        where: { id: input.labelId, organizationId: ctx.organization.id },
      });

      await ctx.db.ticketLabel.delete({
        where: { ticketId_labelId: { ticketId: input.ticketId, labelId: input.labelId } },
      });

      await logActivity(ctx.db, {
        ticketId: input.ticketId,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.LABEL_REMOVED,
        data: { labelName: label?.name },
      });

      return { success: true };
    }),
});
