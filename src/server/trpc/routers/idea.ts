import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { DEFAULT_BOARD_COLUMNS, DEFAULT_WATERFALL_PHASES } from "@/lib/constants";

export const ideaRouter = createTRPCRouter({
  /** List all ideas for the current organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.idea.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        linkedProject: { select: { id: true, key: true, name: true } },
      },
    });
  }),

  /** Get a single idea by ID */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const idea = await ctx.db.idea.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
          linkedProject: {
            select: {
              id: true,
              key: true,
              name: true,
              methodology: true,
              startDate: true,
              endDate: true,
            },
          },
          organization: { select: { id: true, name: true } },
        },
      });
      if (!idea) throw new TRPCError({ code: "NOT_FOUND" });
      if (idea.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return idea;
    }),

  /** Create a new idea */
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        businessCase: z.string().max(10000).optional(),
        expectedROI: z.number().min(0).optional(),
        strategicAlignment: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
        swotAnalysis: z
          .object({
            strengths: z.array(z.string()).optional(),
            weaknesses: z.array(z.string()).optional(),
            opportunities: z.array(z.string()).optional(),
            threats: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.idea.create({
        data: {
          title: input.title,
          description: input.description,
          businessCase: input.businessCase,
          expectedROI: input.expectedROI,
          strategicAlignment: input.strategicAlignment,
          swotAnalysis: input.swotAnalysis ? (input.swotAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull,
          organizationId: ctx.organization.id,
          createdById: ctx.user.id,
          status: "DRAFT",
        },
      });
    }),

  /** Update an idea */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        businessCase: z.string().max(10000).optional(),
        expectedROI: z.number().min(0).optional(),
        strategicAlignment: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
        swotAnalysis: z
          .object({
            strengths: z.array(z.string()).optional(),
            weaknesses: z.array(z.string()).optional(),
            opportunities: z.array(z.string()).optional(),
            threats: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const idea = await ctx.db.idea.findUnique({
        where: { id: input.id },
        select: { organizationId: true, status: true },
      });
      if (!idea) throw new TRPCError({ code: "NOT_FOUND" });
      if (idea.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Don't allow editing APPROVED ideas (they're linked to projects)
      if (idea.status === "APPROVED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot edit approved ideas. They are linked to projects.",
        });
      }

      const { id, ...updateData } = input;
      const data: any = { ...updateData };
      if (input.swotAnalysis !== undefined) {
        data.swotAnalysis = input.swotAnalysis ? (input.swotAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      return ctx.db.idea.update({
        where: { id },
        data,
      });
    }),

  /** Update idea status */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "REVIEW", "APPROVED", "REJECTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const idea = await ctx.db.idea.findUnique({
        where: { id: input.id },
        select: { organizationId: true, status: true, linkedProjectId: true },
      });
      if (!idea) throw new TRPCError({ code: "NOT_FOUND" });
      if (idea.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Prevent changing status if already linked to a project
      if (idea.linkedProjectId && input.status !== "APPROVED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot change status of an idea that is linked to a project.",
        });
      }

      return ctx.db.idea.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  /** Promote an APPROVED idea to a Project */
  promoteToProject: orgProcedure
    .input(
      z.object({
        ideaId: z.string(),
        name: z.string().min(1).max(100),
        key: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, "Key must be uppercase alphanumeric"),
        description: z.string().max(500).optional(),
        programId: z.string().optional(),
        methodology: z.enum(["AGILE", "WATERFALL", "HYBRID"]).default("WATERFALL"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      // Verify idea exists and is APPROVED
      const idea = await ctx.db.idea.findUnique({
        where: { id: input.ideaId },
        select: {
          id: true,
          organizationId: true,
          status: true,
          linkedProjectId: true,
        },
      });
      if (!idea) throw new TRPCError({ code: "NOT_FOUND" });
      if (idea.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (idea.status !== "APPROVED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Only APPROVED ideas can be promoted to projects.",
        });
      }
      if (idea.linkedProjectId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This idea is already linked to a project.",
        });
      }

      // Check if project key already exists
      const existing = await ctx.db.project.findUnique({
        where: { organizationId_key: { organizationId: ctx.organization.id, key: input.key } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: `Key "${input.key}" already exists.` });
      }

      return ctx.db.$transaction(async (tx) => {
        // Create the project
        const project = await tx.project.create({
          data: {
            name: input.name,
            key: input.key,
            description: input.description,
            methodology: input.methodology,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            programId: input.programId,
            organizationId: ctx.organization.id,
            ideaId: idea.id, // Link back to the idea
          },
        });

        // Always create board columns
        await tx.boardColumn.createMany({
          data: DEFAULT_BOARD_COLUMNS.map((col) => ({
            name: col.name,
            position: col.position,
            colType: col.colType,
            boardType: col.boardType,
            projectId: project.id,
          })),
        });

        // For Waterfall and Hybrid, create default phases
        if (input.methodology === "WATERFALL" || input.methodology === "HYBRID") {
          await tx.phase.createMany({
            data: DEFAULT_WATERFALL_PHASES.map((p) => ({
              name: p.name,
              color: p.color,
              position: p.position,
              projectId: project.id,
            })),
          });
        }

        return project;
      });
    }),

  /** Delete an idea */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const idea = await ctx.db.idea.findUnique({
        where: { id: input.id },
        select: { organizationId: true, linkedProjectId: true },
      });
      if (!idea) throw new TRPCError({ code: "NOT_FOUND" });
      if (idea.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (idea.linkedProjectId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete an idea that is linked to a project.",
        });
      }

      return ctx.db.idea.delete({ where: { id: input.id } });
    }),
});
