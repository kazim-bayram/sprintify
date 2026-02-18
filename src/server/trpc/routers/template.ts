import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const templateRouter = createTRPCRouter({
  /** List all project templates for the current organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.projectTemplate.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { phases: true } },
      },
    });
  }),

  /** Get a single template with phases and tasks */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.projectTemplate.findUnique({
        where: { id: input.id },
        include: {
          phases: {
            orderBy: { position: "asc" },
            include: {
              tasks: { orderBy: { position: "asc" } },
            },
          },
        },
      });
      if (!template || template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return template;
    }),

  /** Create a new project template */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        methodology: z.enum(["AGILE", "WATERFALL", "HYBRID"]).default("WATERFALL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage templates." });
      }

      return ctx.db.projectTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          methodology: input.methodology,
          organizationId: ctx.organization.id,
          createdById: ctx.user.id,
        },
      });
    }),

  /** Update template metadata */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
        methodology: z.enum(["AGILE", "WATERFALL", "HYBRID"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const template = await ctx.db.projectTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template || template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ...data } = input;
      return ctx.db.projectTemplate.update({
        where: { id },
        data,
      });
    }),

  /** Delete a template (cascades phases and tasks) */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const template = await ctx.db.projectTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template || template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.projectTemplate.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Add a phase to a template */
  addPhase: orgProcedure
    .input(
      z.object({
        templateId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        color: z.string().default("#3B82F6"),
        isGate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const template = await ctx.db.projectTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (!template || template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maxPos = await ctx.db.templatePhase.aggregate({
        where: { templateId: input.templateId },
        _max: { position: true },
      });

      return ctx.db.templatePhase.create({
        data: {
          name: input.name,
          description: input.description,
          color: input.color,
          isGate: input.isGate,
          position: (maxPos._max.position ?? -1) + 1,
          templateId: input.templateId,
        },
      });
    }),

  /** Update a template phase */
  updatePhase: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullable().optional(),
        color: z.string().optional(),
        isGate: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const phase = await ctx.db.templatePhase.findUnique({
        where: { id: input.id },
        include: { template: true },
      });
      if (!phase || phase.template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ...data } = input;
      return ctx.db.templatePhase.update({
        where: { id },
        data,
      });
    }),

  /** Delete a template phase (cascades tasks) */
  deletePhase: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const phase = await ctx.db.templatePhase.findUnique({
        where: { id: input.id },
        include: { template: true },
      });
      if (!phase || phase.template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.templatePhase.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Add a task to a template phase */
  addTask: orgProcedure
    .input(
      z.object({
        phaseId: z.string(),
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        duration: z.number().min(0).default(0),
        isMilestone: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const phase = await ctx.db.templatePhase.findUnique({
        where: { id: input.phaseId },
        include: { template: true },
      });
      if (!phase || phase.template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const maxPos = await ctx.db.templateTask.aggregate({
        where: { phaseId: input.phaseId },
        _max: { position: true },
      });

      return ctx.db.templateTask.create({
        data: {
          name: input.name,
          description: input.description,
          duration: input.duration,
          isMilestone: input.isMilestone,
          position: (maxPos._max.position ?? -1) + 1,
          phaseId: input.phaseId,
        },
      });
    }),

  /** Update a template task */
  updateTask: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).nullable().optional(),
        duration: z.number().min(0).optional(),
        isMilestone: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const task = await ctx.db.templateTask.findUnique({
        where: { id: input.id },
        include: { phase: { include: { template: true } } },
      });
      if (!task || task.phase.template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ...data } = input;
      return ctx.db.templateTask.update({
        where: { id },
        data,
      });
    }),

  /** Delete a template task */
  deleteTask: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const task = await ctx.db.templateTask.findUnique({
        where: { id: input.id },
        include: { phase: { include: { template: true } } },
      });
      if (!task || task.phase.template.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.templateTask.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

