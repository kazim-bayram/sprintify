import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { DEFAULT_BOARD_COLUMNS, DEFAULT_WATERFALL_PHASES } from "@/lib/constants";

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

  /** Get a single project by key — board columns filtered by boardType */
  getByKey: orgProcedure
    .input(z.object({ key: z.string(), boardType: z.enum(["SPRINT_BOARD", "GLOBAL_PRODUCT_BACKLOG"]).default("SPRINT_BOARD") }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { organizationId_key: { organizationId: ctx.organization.id, key: input.key.toUpperCase() } },
        include: {
          program: { select: { id: true, name: true } },
          features: { orderBy: { position: "asc" } },
          phases: {
            orderBy: { position: "asc" },
            include: {
              _count: { select: { stories: true, sprints: true } },
              dependsOn: { include: { predecessor: { select: { id: true, name: true } } } },
            },
          },
          boardColumns: {
            where: { boardType: input.boardType },
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

  /** Create a new project with default columns and optional phases */
  create: orgProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      key: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, "Key must be uppercase alphanumeric"),
      description: z.string().max(500).optional(),
      programId: z.string().optional(),
      methodology: z.enum(["AGILE", "WATERFALL", "HYBRID"]).default("AGILE"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
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
            methodology: input.methodology,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            programId: input.programId, organizationId: ctx.organization.id,
          },
        });

        // Always create board columns (used by all methodologies)
        await tx.boardColumn.createMany({
          data: DEFAULT_BOARD_COLUMNS.map((col) => ({
            name: col.name, position: col.position, colType: col.colType, boardType: col.boardType, projectId: project.id,
          })),
        });

        // For Waterfall and Hybrid, also create default phases
        if (input.methodology === "WATERFALL" || input.methodology === "HYBRID") {
          await tx.phase.createMany({
            data: DEFAULT_WATERFALL_PHASES.map((p) => ({
              name: p.name, color: p.color, position: p.position, projectId: project.id,
            })),
          });
        }

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

  /** List ALL columns for a project (both board types — for admin) */
  listColumns: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.boardColumn.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ boardType: "asc" }, { position: "asc" }],
        include: { _count: { select: { stories: true } } },
      });
    }),

  /** Add a column to a project */
  addColumn: orgProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(50),
      colType: z.enum(["BACKLOG", "TODO", "DOING", "DONE"]),
      boardType: z.enum(["SPRINT_BOARD", "GLOBAL_PRODUCT_BACKLOG"]),
      wipLimit: z.number().int().min(1).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage columns." });
      const maxPos = await ctx.db.boardColumn.aggregate({
        where: { projectId: input.projectId, boardType: input.boardType },
        _max: { position: true },
      });
      const position = (maxPos._max.position ?? -1) + 1;
      return ctx.db.boardColumn.create({
        data: { name: input.name, position, colType: input.colType, boardType: input.boardType, wipLimit: input.wipLimit ?? null, projectId: input.projectId },
      });
    }),

  /** Update column settings (name, WIP limit, type) */
  updateColumn: orgProcedure
    .input(z.object({
      columnId: z.string(),
      name: z.string().min(1).max(50).optional(),
      colType: z.enum(["BACKLOG", "TODO", "DOING", "DONE"]).optional(),
      wipLimit: z.number().int().min(1).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      const column = await ctx.db.boardColumn.findUnique({
        where: { id: input.columnId },
        include: { project: { select: { organizationId: true } } },
      });
      if (!column || column.project.organizationId !== ctx.organization.id) throw new TRPCError({ code: "NOT_FOUND" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.colType !== undefined) data.colType = input.colType;
      if (input.wipLimit !== undefined) data.wipLimit = input.wipLimit;
      return ctx.db.boardColumn.update({ where: { id: input.columnId }, data });
    }),

  /** Delete a column (stories will be unassigned from column) */
  deleteColumn: orgProcedure
    .input(z.object({ columnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      const column = await ctx.db.boardColumn.findUnique({
        where: { id: input.columnId },
        include: { project: { select: { organizationId: true } }, _count: { select: { stories: true } } },
      });
      if (!column || column.project.organizationId !== ctx.organization.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (column._count.stories > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Column "${column.name}" still has ${column._count.stories} stories. Move them first.` });
      }
      await ctx.db.boardColumn.delete({ where: { id: input.columnId } });
      return { success: true };
    }),
});
