import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";

export const searchRouter = createTRPCRouter({
  global: orgProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      const q = input.query.trim();
      const [stories, projects] = await Promise.all([
        ctx.db.userStory.findMany({
          where: {
            organizationId: ctx.organization.id, archivedAt: null,
            OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
          },
          select: { id: true, number: true, title: true, status: true, priority: true, department: true, project: { select: { key: true } } },
          take: 10, orderBy: { updatedAt: "desc" },
        }),
        ctx.db.project.findMany({
          where: {
            organizationId: ctx.organization.id,
            OR: [{ name: { contains: q, mode: "insensitive" } }, { key: { contains: q, mode: "insensitive" } }],
          },
          select: { id: true, name: true, key: true },
          take: 5,
        }),
      ]);
      return { stories, projects };
    }),
});
