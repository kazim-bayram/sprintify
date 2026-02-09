import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";

export const searchRouter = createTRPCRouter({
  /** Global search across tickets and projects */
  global: orgProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      const q = input.query.trim();

      const [tickets, projects] = await Promise.all([
        ctx.db.ticket.findMany({
          where: {
            organizationId: ctx.organization.id,
            archivedAt: null,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            priority: true,
            project: { select: { key: true } },
          },
          take: 10,
          orderBy: { updatedAt: "desc" },
        }),
        ctx.db.project.findMany({
          where: {
            organizationId: ctx.organization.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { key: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, key: true },
          take: 5,
        }),
      ]);

      return { tickets, projects };
    }),

  /** Filter tickets on a board */
  filterTickets: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        assigneeId: z.string().optional(),
        priority: z.string().optional(),
        labelId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["created", "updated", "priority", "points"]).default("created"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderBy: Record<string, string> = {};
      switch (input.sortBy) {
        case "created":
          orderBy.createdAt = input.sortOrder;
          break;
        case "updated":
          orderBy.updatedAt = input.sortOrder;
          break;
        case "priority":
          orderBy.priority = input.sortOrder;
          break;
        case "points":
          orderBy.storyPoints = input.sortOrder;
          break;
      }

      return ctx.db.ticket.findMany({
        where: {
          projectId: input.projectId,
          organizationId: ctx.organization.id,
          archivedAt: null,
          ...(input.assigneeId && { assigneeId: input.assigneeId }),
          ...(input.priority && { priority: input.priority }),
          ...(input.labelId && {
            labels: { some: { labelId: input.labelId } },
          }),
          ...(input.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" as const } },
              { description: { contains: input.search, mode: "insensitive" as const } },
            ],
          }),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          labels: { include: { label: true } },
          column: { select: { id: true, name: true } },
        },
        orderBy,
      });
    }),
});
