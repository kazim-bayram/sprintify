import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { logActivity, ACTIVITY_TYPES } from "@/server/activity";

export const ticketRouter = createTRPCRouter({
  /** Get a single ticket by ID with all details */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.ticket.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id, archivedAt: null },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, key: true } },
          column: { select: { id: true, name: true, position: true } },
          labels: { include: { label: true } },
          comments: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          activities: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          attachments: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
      return ticket;
    }),

  /** Create a new ticket */
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().optional(),
        columnId: z.string().optional(),
        sprintId: z.string().nullable().optional(),
        priority: z.string().default("NONE"),
        storyPoints: z.number().int().min(0).nullable().optional(),
        assigneeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN", message: "Viewers cannot create tickets." });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        include: { boardColumns: { orderBy: { position: "asc" }, take: 1 } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });

      const targetColumnId = input.columnId ?? project.boardColumns[0]?.id;

      const [updatedProject, ticketCount] = await Promise.all([
        ctx.db.project.update({
          where: { id: project.id },
          data: { ticketCounter: { increment: 1 } },
        }),
        ctx.db.ticket.count({ where: { projectId: project.id, columnId: targetColumnId } }),
      ]);

      return ctx.db.ticket.create({
        data: {
          number: updatedProject.ticketCounter,
          title: input.title,
          description: input.description,
          status: "BACKLOG",
          priority: input.priority,
          position: ticketCount,
          storyPoints: input.storyPoints ?? null,
          projectId: project.id,
          columnId: targetColumnId,
          sprintId: input.sprintId ?? null,
          assigneeId: input.assigneeId,
          reporterId: ctx.user.id,
          organizationId: ctx.organization.id,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
      });
    }),

  /** Update a ticket with activity logging */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().nullable().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        columnId: z.string().optional(),
        position: z.number().int().min(0).optional(),
        assigneeId: z.string().nullable().optional(),
        storyPoints: z.number().int().min(0).nullable().optional(),
        sprintId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN", message: "Viewers cannot edit tickets." });

      const { id, columnId, assigneeId, sprintId, ...rest } = input;

      const ticket = await ctx.db.ticket.findFirst({
        where: { id, organizationId: ctx.organization.id },
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...rest };

      if (columnId !== undefined) {
        updateData.column = columnId
          ? { connect: { id: columnId } }
          : { disconnect: true };
      }
      if (assigneeId !== undefined) {
        updateData.assignee = assigneeId
          ? { connect: { id: assigneeId } }
          : { disconnect: true };
      }
      if (sprintId !== undefined) {
        updateData.sprint = sprintId
          ? { connect: { id: sprintId } }
          : { disconnect: true };
      }

      const updated = await ctx.db.ticket.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
      });

      // Log activities for tracked changes
      const activities: Promise<unknown>[] = [];

      if (input.status && input.status !== ticket.status) {
        activities.push(
          logActivity(ctx.db, {
            ticketId: id,
            userId: ctx.user.id,
            type: ACTIVITY_TYPES.STATUS_CHANGE,
            data: { from: ticket.status, to: input.status },
          })
        );
      }
      if (input.priority && input.priority !== ticket.priority) {
        activities.push(
          logActivity(ctx.db, {
            ticketId: id,
            userId: ctx.user.id,
            type: ACTIVITY_TYPES.PRIORITY_CHANGE,
            data: { from: ticket.priority, to: input.priority },
          })
        );
      }
      if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
        activities.push(
          logActivity(ctx.db, {
            ticketId: id,
            userId: ctx.user.id,
            type: assigneeId ? ACTIVITY_TYPES.ASSIGNED : ACTIVITY_TYPES.UNASSIGNED,
            data: { assigneeId },
          })
        );
      }
      if (input.storyPoints !== undefined && input.storyPoints !== ticket.storyPoints) {
        activities.push(
          logActivity(ctx.db, {
            ticketId: id,
            userId: ctx.user.id,
            type: ACTIVITY_TYPES.STORY_POINTS_CHANGED,
            data: { from: ticket.storyPoints, to: input.storyPoints },
          })
        );
      }

      await Promise.all(activities);
      return updated;
    }),

  /** Move a ticket to a different column (drag & drop) */
  move: orgProcedure
    .input(
      z.object({
        ticketId: z.string(),
        targetColumnId: z.string(),
        targetPosition: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN", message: "Viewers cannot move tickets." });

      const ticket = await ctx.db.ticket.findFirst({
        where: { id: input.ticketId, organizationId: ctx.organization.id },
        include: { column: true },
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });

      const targetColumn = await ctx.db.boardColumn.findUnique({
        where: { id: input.targetColumnId },
      });

      const updated = await ctx.db.ticket.update({
        where: { id: input.ticketId },
        data: { columnId: input.targetColumnId, position: input.targetPosition },
      });

      // Log column change as status change
      if (ticket.columnId !== input.targetColumnId && targetColumn) {
        await logActivity(ctx.db, {
          ticketId: input.ticketId,
          userId: ctx.user.id,
          type: ACTIVITY_TYPES.STATUS_CHANGE,
          data: { from: ticket.column?.name, to: targetColumn.name },
        });
      }

      return updated;
    }),

  /** Soft-delete (archive) a ticket */
  archive: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER")
        throw new TRPCError({ code: "FORBIDDEN" });

      const ticket = await ctx.db.ticket.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      await logActivity(ctx.db, {
        ticketId: input.id,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.TICKET_ARCHIVED,
      });

      return ctx.db.ticket.update({
        where: { id: input.id },
        data: { archivedAt: new Date() },
      });
    }),

  /** Restore an archived ticket */
  restore: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      await logActivity(ctx.db, {
        ticketId: input.id,
        userId: ctx.user.id,
        type: ACTIVITY_TYPES.TICKET_RESTORED,
      });

      return ctx.db.ticket.update({
        where: { id: input.id },
        data: { archivedAt: null },
      });
    }),
});
