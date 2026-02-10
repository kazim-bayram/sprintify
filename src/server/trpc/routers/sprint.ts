import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const sprintRouter = createTRPCRouter({
  list: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findMany({
        where: { projectId: input.projectId, organizationId: ctx.organization.id },
        include: { _count: { select: { stories: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  getActive: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findFirst({
        where: { projectId: input.projectId, organizationId: ctx.organization.id, status: "ACTIVE" },
        include: {
          _count: { select: { stories: true } },
          stories: { where: { archivedAt: null }, select: { id: true, storyPoints: true, status: true, columnId: true, userBusinessValue: true } },
        },
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
        include: {
          _count: { select: { stories: true } },
          stories: {
            where: { archivedAt: null },
            include: {
              assignee: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
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

  create: orgProcedure
    .input(z.object({ projectId: z.string(), name: z.string().min(1).max(100), goal: z.string().max(500).optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.sprint.create({
        data: { name: input.name, goal: input.goal, startDate: input.startDate ? new Date(input.startDate) : null, endDate: input.endDate ? new Date(input.endDate) : null, projectId: input.projectId, organizationId: ctx.organization.id },
      });
    }),

  start: orgProcedure
    .input(z.object({ id: z.string(), startDate: z.string(), endDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const sprint = await ctx.db.sprint.findFirst({ where: { id: input.id, organizationId: ctx.organization.id } });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      if (sprint.status !== "PLANNING") throw new TRPCError({ code: "BAD_REQUEST", message: "Sprint is not in planning state." });

      const activeSprint = await ctx.db.sprint.findFirst({ where: { projectId: sprint.projectId, organizationId: ctx.organization.id, status: "ACTIVE" } });
      if (activeSprint) throw new TRPCError({ code: "CONFLICT", message: `Sprint "${activeSprint.name}" is already active.` });

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (endDate <= startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date." });

      const stories = await ctx.db.userStory.findMany({ where: { sprintId: sprint.id, archivedAt: null }, select: { storyPoints: true, status: true, userBusinessValue: true } });
      const totalPoints = stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const completedPoints = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const totalValue = stories.reduce((s, t) => s + t.userBusinessValue, 0);
      const completedValue = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + t.userBusinessValue, 0);

      await ctx.db.sprint.update({ where: { id: input.id }, data: { status: "ACTIVE", startDate, endDate } });
      await ctx.db.sprintSnapshot.create({ data: { sprintId: sprint.id, date: startDate, totalPoints, completedPoints, totalValue, completedValue } });

      return ctx.db.sprint.findUnique({ where: { id: input.id }, include: { _count: { select: { stories: true } } } });
    }),

  close: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const sprint = await ctx.db.sprint.findFirst({ where: { id: input.id, organizationId: ctx.organization.id } });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      if (sprint.status !== "ACTIVE") throw new TRPCError({ code: "BAD_REQUEST", message: "Sprint is not active." });

      const stories = await ctx.db.userStory.findMany({ where: { sprintId: sprint.id, archivedAt: null }, select: { storyPoints: true, status: true, userBusinessValue: true } });
      const totalPoints = stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const completedPoints = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const totalValue = stories.reduce((s, t) => s + t.userBusinessValue, 0);
      const completedValue = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + t.userBusinessValue, 0);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      await ctx.db.sprintSnapshot.upsert({
        where: { sprintId_date: { sprintId: sprint.id, date: today } },
        create: { sprintId: sprint.id, date: today, totalPoints, completedPoints, totalValue, completedValue },
        update: { totalPoints, completedPoints, totalValue, completedValue },
      });

      return ctx.db.sprint.update({ where: { id: input.id }, data: { status: "CLOSED" }, include: { _count: { select: { stories: true } } } });
    }),

  getIncompleteStories: orgProcedure
    .input(z.object({ sprintId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userStory.findMany({
        where: { sprintId: input.sprintId, organizationId: ctx.organization.id, archivedAt: null, status: { not: "DONE" } },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { position: "asc" },
      });
    }),

  rollover: orgProcedure
    .input(z.object({ sprintId: z.string(), decisions: z.array(z.object({ storyId: z.string(), action: z.enum(["NEXT_SPRINT", "BACKLOG"]) })) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const sprint = await ctx.db.sprint.findFirst({ where: { id: input.sprintId, organizationId: ctx.organization.id } });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });

      let nextSprint = await ctx.db.sprint.findFirst({ where: { projectId: sprint.projectId, organizationId: ctx.organization.id, status: "PLANNING" }, orderBy: { createdAt: "desc" } });
      const needsNext = input.decisions.some((d) => d.action === "NEXT_SPRINT");
      if (needsNext && !nextSprint) {
        const count = await ctx.db.sprint.count({ where: { projectId: sprint.projectId } });
        nextSprint = await ctx.db.sprint.create({ data: { name: `Sprint ${count + 1}`, projectId: sprint.projectId, organizationId: ctx.organization.id } });
      }

      for (const d of input.decisions) {
        await ctx.db.userStory.update({ where: { id: d.storyId }, data: { sprintId: d.action === "NEXT_SPRINT" && nextSprint ? nextSprint.id : null } });
      }
      return { nextSprintId: nextSprint?.id ?? null };
    }),

  history: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sprint.findMany({
        where: { projectId: input.projectId, organizationId: ctx.organization.id, status: "CLOSED" },
        include: { _count: { select: { stories: true } }, snapshots: { orderBy: { date: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
      });
    }),

  recordSnapshot: orgProcedure
    .input(z.object({ sprintId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findFirst({ where: { id: input.sprintId, organizationId: ctx.organization.id, status: "ACTIVE" } });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      const stories = await ctx.db.userStory.findMany({ where: { sprintId: sprint.id, archivedAt: null }, select: { storyPoints: true, status: true, userBusinessValue: true } });
      const totalPoints = stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const completedPoints = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const totalValue = stories.reduce((s, t) => s + t.userBusinessValue, 0);
      const completedValue = stories.filter((t) => t.status === "DONE").reduce((s, t) => s + t.userBusinessValue, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return ctx.db.sprintSnapshot.upsert({
        where: { sprintId_date: { sprintId: sprint.id, date: today } },
        create: { sprintId: sprint.id, date: today, totalPoints, completedPoints, totalValue, completedValue },
        update: { totalPoints, completedPoints, totalValue, completedValue },
      });
    }),
});
