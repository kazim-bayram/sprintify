import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/constants";

export const projectRouter = createTRPCRouter({
  /**
   * List all projects for the current organization.
   */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });
  }),

  /**
   * Get a single project by slug (key).
   */
  getByKey: orgProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: {
          organizationId_key: {
            organizationId: ctx.organization.id,
            key: input.key.toUpperCase(),
          },
        },
        include: {
          boardColumns: {
            orderBy: { position: "asc" },
            include: {
              tickets: {
                where: { archivedAt: null },
                orderBy: { position: "asc" },
                include: {
                  assignee: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                  },
                  labels: { include: { label: true } },
                },
              },
            },
          },
          _count: {
            select: { tickets: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      return project;
    }),

  /**
   * Create a new project with default board columns.
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        key: z
          .string()
          .min(2, "Key must be at least 2 characters")
          .max(10)
          .regex(/^[A-Z0-9]+$/, "Key must be uppercase alphanumeric"),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for admin or member role
      if (ctx.role === "VIEWER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Viewers cannot create projects.",
        });
      }

      // Check if key is unique within org
      const existing = await ctx.db.project.findUnique({
        where: {
          organizationId_key: {
            organizationId: ctx.organization.id,
            key: input.key,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A project with key "${input.key}" already exists.`,
        });
      }

      // Create project with default board columns in a transaction
      return ctx.db.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            name: input.name,
            key: input.key,
            description: input.description,
            organizationId: ctx.organization.id,
          },
        });

        // Create default board columns
        await tx.boardColumn.createMany({
          data: DEFAULT_BOARD_COLUMNS.map((col) => ({
            name: col.name,
            position: col.position,
            projectId: project.id,
          })),
        });

        return project;
      });
    }),

  /** Rename a board column */
  renameColumn: orgProcedure
    .input(
      z.object({
        columnId: z.string(),
        name: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      const column = await ctx.db.boardColumn.findUnique({
        where: { id: input.columnId },
        include: { project: { select: { organizationId: true } } },
      });
      if (!column || column.project.organizationId !== ctx.organization.id)
        throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.boardColumn.update({
        where: { id: input.columnId },
        data: { name: input.name },
      });
    }),
});
