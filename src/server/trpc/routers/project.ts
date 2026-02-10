import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/constants";

export const projectRouter = createTRPCRouter({
  /** List all projects for the current organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { createdAt: "desc" },
      include: {
        program: { select: { id: true, name: true } },
        _count: { select: { stories: true } },
      },
    });
  }),

  /** Get a single project by key */
  getByKey: orgProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { organizationId_key: { organizationId: ctx.organization.id, key: input.key.toUpperCase() } },
        include: {
          program: { select: { id: true, name: true } },
          features: { orderBy: { position: "asc" } },
          boardColumns: {
            orderBy: { position: "asc" },
            include: {
              stories: {
                where: { archivedAt: null },
                orderBy: { position: "asc" },
                include: {
                  assignee: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
                  feature: { select: { id: true, name: true } },
                  labels: { include: { label: true } },
                  checklists: { where: { type: "DOD" }, select: { id: true, checked: true } },
                  _count: { select: { tasks: true } },
                },
              },
            },
          },
          _count: { select: { stories: true } },
        },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  /** Create a new project with default NPD columns */
  create: orgProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      key: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, "Key must be uppercase alphanumeric"),
      description: z.string().max(500).optional(),
      programId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.project.findUnique({
        where: { organizationId_key: { organizationId: ctx.organization.id, key: input.key } },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: `Key "${input.key}" already exists.` });

      return ctx.db.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            name: input.name, key: input.key, description: input.description,
            programId: input.programId, organizationId: ctx.organization.id,
          },
        });
        await tx.boardColumn.createMany({
          data: DEFAULT_BOARD_COLUMNS.map((col) => ({ name: col.name, position: col.position, projectId: project.id })),
        });
        return project;
      });
    }),

  /** Rename a board column */
  renameColumn: orgProcedure
    .input(z.object({ columnId: z.string(), name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const column = await ctx.db.boardColumn.findUnique({
        where: { id: input.columnId },
        include: { project: { select: { organizationId: true } } },
      });
      if (!column || column.project.organizationId !== ctx.organization.id) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.boardColumn.update({ where: { id: input.columnId }, data: { name: input.name } });
    }),
});
