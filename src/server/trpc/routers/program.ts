import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const programRouter = createTRPCRouter({
  /** List all programs for the organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.program.findMany({
      where: { organizationId: ctx.organization.id },
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Create a program (brand/category) */
  create: orgProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.program.create({
        data: { name: input.name, description: input.description, organizationId: ctx.organization.id },
      });
    }),
});
