import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const featureRouter = createTRPCRouter({
  /** List features (stages) for a project */
  list: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feature.findMany({
        where: { projectId: input.projectId },
        include: { _count: { select: { stories: true } } },
        orderBy: { position: "asc" },
      });
    }),

  /** Create a feature (stage) */
  create: orgProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const count = await ctx.db.feature.count({ where: { projectId: input.projectId } });
      return ctx.db.feature.create({
        data: { name: input.name, description: input.description, projectId: input.projectId, position: count },
      });
    }),

  /** Delete a feature */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.feature.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
