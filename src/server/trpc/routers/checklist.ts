import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const checklistRouter = createTRPCRouter({
  /** List checklist items for a story */
  list: orgProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.checklistItem.findMany({
        where: { storyId: input.storyId },
        orderBy: [{ type: "asc" }, { position: "asc" }],
      });
    }),

  /** Create a checklist item */
  create: orgProcedure
    .input(z.object({
      storyId: z.string(),
      title: z.string().min(1).max(200),
      type: z.enum(["DOR", "DOD"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const count = await ctx.db.checklistItem.count({
        where: { storyId: input.storyId, type: input.type },
      });
      return ctx.db.checklistItem.create({
        data: { title: input.title, type: input.type, storyId: input.storyId, position: count },
      });
    }),

  /** Toggle a checklist item */
  toggle: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const item = await ctx.db.checklistItem.findUnique({ where: { id: input.id } });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.checklistItem.update({
        where: { id: input.id },
        data: { checked: !item.checked },
      });
    }),

  /** Check if all DoD items are completed (quality gate) */
  isDodComplete: orgProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const dodItems = await ctx.db.checklistItem.findMany({
        where: { storyId: input.storyId, type: "DOD" },
      });
      if (dodItems.length === 0) return { complete: true, total: 0, checked: 0 };
      const checked = dodItems.filter((i) => i.checked).length;
      return { complete: checked === dodItems.length, total: dodItems.length, checked };
    }),

  /** Delete a checklist item */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.checklistItem.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
