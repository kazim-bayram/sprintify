import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { assertDemoPhaseLimit, assertDemoTaskLimit } from "@/server/demo-limits";

/**
 * Phase router — CRUD for Waterfall/Hybrid phases with soft-validation warnings.
 * Warnings do NOT block saves — they inform the user of potential issues.
 */
export const phaseRouter = createTRPCRouter({
  /** List phases for a project (ordered by position) */
  list: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.phase.findMany({
        where: { projectId: input.projectId },
        orderBy: { position: "asc" },
        include: {
          _count: { select: { stories: true, sprints: true } },
          dependsOn: { include: { predecessor: { select: { id: true, name: true } } } },
          dependedOnBy: { include: { successor: { select: { id: true, name: true } } } },
        },
      });
    }),

  /** Get a single phase with stories and sprints */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const phase = await ctx.db.phase.findUnique({
        where: { id: input.id },
        include: {
          project: { select: { id: true, name: true, key: true, organizationId: true } },
          stories: {
            where: { archivedAt: null },
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          sprints: { orderBy: { startDate: "asc" } },
          dependsOn: { include: { predecessor: { select: { id: true, name: true, endDate: true } } } },
          dependedOnBy: { include: { successor: { select: { id: true, name: true, startDate: true } } } },
        },
      });
      if (!phase || phase.project.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return phase;
    }),

  /** Create a new phase */
  create: orgProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().default("#3B82F6"),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      await assertDemoPhaseLimit(ctx.db, input.projectId);
      await assertDemoTaskLimit(ctx.db, input.projectId);

      const maxPos = await ctx.db.phase.aggregate({
        where: { projectId: input.projectId },
        _max: { position: true },
      });

      return ctx.db.phase.create({
        data: {
          name: input.name,
          description: input.description,
          color: input.color,
          position: (maxPos._max.position ?? -1) + 1,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          projectId: input.projectId,
        },
      });
    }),

  /** Update phase with soft-validation warnings */
  update: orgProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
      color: z.string().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      progress: z.number().int().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const phase = await ctx.db.phase.findUnique({
        where: { id: input.id },
        include: {
          project: { select: { organizationId: true } },
          stories: { select: { id: true, createdAt: true }, where: { archivedAt: null } },
          sprints: { select: { id: true, startDate: true, endDate: true } },
          dependsOn: { include: { predecessor: { select: { id: true, name: true, endDate: true } } } },
        },
      });
      if (!phase || phase.project.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const warnings: string[] = [];

      const newStart = input.startDate !== undefined
        ? (input.startDate ? new Date(input.startDate) : null)
        : phase.startDate;
      const newEnd = input.endDate !== undefined
        ? (input.endDate ? new Date(input.endDate) : null)
        : phase.endDate;

      // --- Soft Validation: Date range checks ---
      if (newStart && newEnd) {
        // Check sprints that fall outside new phase dates
        const outOfBoundsSprints = phase.sprints.filter((s) => {
          if (!s.startDate || !s.endDate) return false;
          return s.startDate < newStart || s.endDate > newEnd;
        });
        if (outOfBoundsSprints.length > 0) {
          warnings.push(`Warning: ${outOfBoundsSprints.length} sprint(s) fall outside the new phase dates.`);
        }
      }

      // --- Soft Validation: Dependency overlap ---
      if (newStart) {
        for (const dep of phase.dependsOn) {
          const predEnd = dep.predecessor.endDate;
          if (predEnd && newStart < predEnd) {
            warnings.push(`Warning: Start date conflicts with predecessor "${dep.predecessor.name}" (ends ${predEnd.toISOString().split("T")[0]}).`);
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.color !== undefined) data.color = input.color;
      if (input.progress !== undefined) data.progress = input.progress;
      if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
      if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;

      const updated = await ctx.db.phase.update({ where: { id: input.id }, data });

      return { phase: updated, warnings };
    }),

  /** Delete a phase */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const phase = await ctx.db.phase.findUnique({
        where: { id: input.id },
        include: { project: { select: { organizationId: true } } },
      });
      if (!phase || phase.project.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // Unlink stories before deleting
      await ctx.db.userStory.updateMany({ where: { phaseId: input.id }, data: { phaseId: null } });
      await ctx.db.sprint.updateMany({ where: { phaseId: input.id }, data: { phaseId: null } });
      await ctx.db.phase.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Add a dependency between two phases (predecessor → successor) */
  addDependency: orgProcedure
    .input(z.object({ predecessorId: z.string(), successorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      if (input.predecessorId === input.successorId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A phase cannot depend on itself." });
      }

      const warnings: string[] = [];

      const [pred, succ] = await Promise.all([
        ctx.db.phase.findUnique({ where: { id: input.predecessorId } }),
        ctx.db.phase.findUnique({ where: { id: input.successorId } }),
      ]);
      if (!pred || !succ) throw new TRPCError({ code: "NOT_FOUND" });

      // Soft warning if dates overlap
      if (pred.endDate && succ.startDate && succ.startDate < pred.endDate) {
        warnings.push(`Warning: "${succ.name}" starts before "${pred.name}" ends. Consider adjusting dates.`);
      }

      await ctx.db.phaseDependency.create({
        data: { predecessorId: input.predecessorId, successorId: input.successorId },
      });

      return { success: true, warnings };
    }),

  /** Remove a dependency */
  removeDependency: orgProcedure
    .input(z.object({ predecessorId: z.string(), successorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.phaseDependency.delete({
        where: { predecessorId_successorId: { predecessorId: input.predecessorId, successorId: input.successorId } },
      });
      return { success: true };
    }),
});
