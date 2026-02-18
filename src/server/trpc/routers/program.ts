import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const programRouter = createTRPCRouter({
  /** List all programs for the organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.program.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        _count: { select: { projects: true } },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Get program details with aggregated metrics */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const program = await ctx.db.program.findUnique({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
          projects: {
            include: {
              phases: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                  progress: true,
                  isGate: true,
                },
                orderBy: { position: "asc" },
              },
              _count: { select: { stories: true } },
            },
            orderBy: { startDate: "asc" },
          },
        },
      });

      if (!program || program.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Calculate aggregated metrics
      const projects = program.projects;
      const totalBudget = projects.reduce((sum, p) => {
        // For now, we'll use a placeholder budget calculation
        // In a real system, projects might have budget fields
        return sum;
      }, 0);

      // Calculate weighted average progress
      let totalProgress = 0;
      let projectsWithProgress = 0;
      for (const project of projects) {
        if (project.phases.length > 0) {
          const phaseProgress = project.phases.reduce((sum, phase) => sum + phase.progress, 0);
          const avgProgress = phaseProgress / project.phases.length;
          totalProgress += avgProgress;
          projectsWithProgress++;
        }
      }
      const averageProgress = projectsWithProgress > 0 ? totalProgress / projectsWithProgress : 0;

      // Count active projects (projects with phases in progress or planned)
      const activeProjects = projects.filter((p) => {
        if (p.phases.length === 0) return false;
        return p.phases.some((phase) => phase.progress < 100);
      }).length;

      // Determine health based on child project status
      // If any project is significantly delayed or at risk, mark program as AT_RISK
      let calculatedHealth: "ON_TRACK" | "AT_RISK" | "OFF_TRACK" = "ON_TRACK";
      const today = new Date();
      for (const project of projects) {
        if (project.endDate) {
          const daysUntilEnd = Math.round((project.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const projectProgress = project.phases.length > 0
            ? project.phases.reduce((sum, phase) => sum + phase.progress, 0) / project.phases.length
            : 0;

          // If project is past due or very behind schedule
          if (daysUntilEnd < -30 || (daysUntilEnd < 0 && projectProgress < 50)) {
            calculatedHealth = "OFF_TRACK";
            break;
          } else if (daysUntilEnd < 30 && projectProgress < 70) {
            calculatedHealth = "AT_RISK";
          }
        }
      }

      // Use manual override if set, otherwise use calculated
      const health = program.health === "ON_TRACK" && calculatedHealth !== "ON_TRACK" ? calculatedHealth : program.health;

      return {
        ...program,
        metrics: {
          totalBudget: program.budget,
          spent: program.spent,
          averageProgress: Math.round(averageProgress),
          activeProjects,
          totalProjects: projects.length,
          calculatedHealth,
          health,
        },
      };
    }),

  /** Create a program */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        strategicGoal: z.string().max(1000).optional(),
        ownerId: z.string().optional(),
        startDate: z.string().optional(),
        targetDate: z.string().optional(),
        budget: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.program.create({
        data: {
          name: input.name,
          description: input.description,
          strategicGoal: input.strategicGoal,
          ownerId: input.ownerId,
          startDate: input.startDate ? new Date(input.startDate) : null,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          budget: input.budget ?? 0,
          organizationId: ctx.organization.id,
        },
      });
    }),

  /** Update program */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        status: z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
        health: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK"]).optional(),
        strategicGoal: z.string().max(1000).optional(),
        ownerId: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        targetDate: z.string().nullable().optional(),
        budget: z.number().min(0).optional(),
        spent: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const program = await ctx.db.program.findUnique({
        where: { id: input.id },
      });
      if (!program || program.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ownerId, startDate, targetDate, ...data } = input;
      const updateData: any = { ...data };
      if (ownerId !== undefined) {
        updateData.ownerId = ownerId;
      }
      if (startDate !== undefined) {
        updateData.startDate = startDate ? new Date(startDate) : null;
      }
      if (targetDate !== undefined) {
        updateData.targetDate = targetDate ? new Date(targetDate) : null;
      }

      return ctx.db.program.update({
        where: { id },
        data: updateData,
      });
    }),

  /** Delete a program */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const program = await ctx.db.program.findUnique({
        where: { id: input.id },
      });
      if (!program || program.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.program.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
