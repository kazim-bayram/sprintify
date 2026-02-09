import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const sprintRouter = createTRPCRouter({
  /** List sprints for a project */
  list: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findMany({
        where: { projectId: input.projectId, organizationId: ctx.organization.id },
        include: {
          _count: { select: { tickets: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Get the currently active sprint for a project */
  getActive: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findFirst({
        where: {
          projectId: input.projectId,
          organizationId: ctx.organization.id,
          status: "ACTIVE",
        },
        include: {
          _count: { select: { tickets: true } },
          tickets: {
            where: { archivedAt: null },
            select: { id: true, storyPoints: true, status: true, columnId: true },
          },
        },
      });
    }),

  /** Get a sprint by ID with full ticket data */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
        include: {
          _count: { select: { tickets: true } },
          tickets: {
            where: { archivedAt: null },
            include: {
              assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
              column: { select: { id: true, name: true, position: true } },
              labels: { include: { label: true } },
            },
            orderBy: { position: "asc" },
          },
          snapshots: { orderBy: { date: "asc" } },
        },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      return sprint;
    }),

  /** Create a new sprint */
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(100),
        goal: z.string().max(500).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.sprint.create({
        data: {
          name: input.name,
          goal: input.goal,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          projectId: input.projectId,
          organizationId: ctx.organization.id,
        },
      });
    }),

  /** Start a sprint — validates one active per project, sets dates */
  start: orgProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      if (sprint.status !== "PLANNING")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sprint is not in planning state." });

      // Check no other active sprint
      const activeSprint = await ctx.db.sprint.findFirst({
        where: {
          projectId: sprint.projectId,
          organizationId: ctx.organization.id,
          status: "ACTIVE",
        },
      });
      if (activeSprint)
        throw new TRPCError({
          code: "CONFLICT",
          message: `Sprint "${activeSprint.name}" is already active. Close it first.`,
        });

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (endDate <= startDate)
        throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date." });

      // Create initial snapshot
      const tickets = await ctx.db.ticket.findMany({
        where: { sprintId: sprint.id, archivedAt: null },
        select: { storyPoints: true, status: true },
      });
      const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      const completedPoints = tickets
        .filter((t) => t.status === "DONE")
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

      await ctx.db.sprint.update({
        where: { id: input.id },
        data: { status: "ACTIVE", startDate, endDate },
      });

      await ctx.db.sprintSnapshot.create({
        data: {
          sprintId: sprint.id,
          date: startDate,
          totalPoints,
          completedPoints,
        },
      });

      return ctx.db.sprint.findUnique({
        where: { id: input.id },
        include: { _count: { select: { tickets: true } } },
      });
    }),

  /** Close a sprint */
  close: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      if (sprint.status !== "ACTIVE")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sprint is not active." });

      // Final snapshot
      const tickets = await ctx.db.ticket.findMany({
        where: { sprintId: sprint.id, archivedAt: null },
        select: { storyPoints: true, status: true },
      });
      const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      const completedPoints = tickets
        .filter((t) => t.status === "DONE")
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await ctx.db.sprintSnapshot.upsert({
        where: { sprintId_date: { sprintId: sprint.id, date: today } },
        create: { sprintId: sprint.id, date: today, totalPoints, completedPoints },
        update: { totalPoints, completedPoints },
      });

      return ctx.db.sprint.update({
        where: { id: input.id },
        data: { status: "CLOSED" },
        include: { _count: { select: { tickets: true } } },
      });
    }),

  /** Get incomplete tickets for a sprint (for rollover modal) */
  getIncompleteTickets: orgProcedure
    .input(z.object({ sprintId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ticket.findMany({
        where: {
          sprintId: input.sprintId,
          organizationId: ctx.organization.id,
          archivedAt: null,
          status: { not: "DONE" },
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { position: "asc" },
      });
    }),

  /** Rollover tickets from a closed sprint */
  rollover: orgProcedure
    .input(
      z.object({
        sprintId: z.string(),
        decisions: z.array(
          z.object({
            ticketId: z.string(),
            action: z.enum(["NEXT_SPRINT", "BACKLOG"]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.sprintId, organizationId: ctx.organization.id },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });

      // Find or create next sprint
      let nextSprint = await ctx.db.sprint.findFirst({
        where: {
          projectId: sprint.projectId,
          organizationId: ctx.organization.id,
          status: "PLANNING",
        },
        orderBy: { createdAt: "desc" },
      });

      const needsNextSprint = input.decisions.some((d) => d.action === "NEXT_SPRINT");
      if (needsNextSprint && !nextSprint) {
        const sprintCount = await ctx.db.sprint.count({
          where: { projectId: sprint.projectId },
        });
        nextSprint = await ctx.db.sprint.create({
          data: {
            name: `Sprint ${sprintCount + 1}`,
            projectId: sprint.projectId,
            organizationId: ctx.organization.id,
          },
        });
      }

      // Process each ticket decision
      for (const decision of input.decisions) {
        if (decision.action === "NEXT_SPRINT" && nextSprint) {
          await ctx.db.ticket.update({
            where: { id: decision.ticketId },
            data: { sprintId: nextSprint.id },
          });
        } else {
          // Move to backlog — remove from sprint
          await ctx.db.ticket.update({
            where: { id: decision.ticketId },
            data: { sprintId: null },
          });
        }
      }

      return { nextSprintId: nextSprint?.id ?? null };
    }),

  /** Get sprint history (closed sprints with stats) */
  history: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findMany({
        where: {
          projectId: input.projectId,
          organizationId: ctx.organization.id,
          status: "CLOSED",
        },
        include: {
          _count: { select: { tickets: true } },
          snapshots: { orderBy: { date: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  /** Record daily burndown snapshot (called by cron or on ticket status change) */
  recordSnapshot: orgProcedure
    .input(z.object({ sprintId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.sprintId, organizationId: ctx.organization.id, status: "ACTIVE" },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });

      const tickets = await ctx.db.ticket.findMany({
        where: { sprintId: sprint.id, archivedAt: null },
        select: { storyPoints: true, status: true },
      });
      const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      const completedPoints = tickets
        .filter((t) => t.status === "DONE")
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return ctx.db.sprintSnapshot.upsert({
        where: { sprintId_date: { sprintId: sprint.id, date: today } },
        create: { sprintId: sprint.id, date: today, totalPoints, completedPoints },
        update: { totalPoints, completedPoints },
      });
    }),
});
