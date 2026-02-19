import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

const RETRO_COLUMN = z.enum(["WENT_WELL", "TO_IMPROVE", "ACTION_ITEM"]);

export const retroRouter = createTRPCRouter({
  getBoard: orgProcedure
    .input(z.object({ sprintId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findFirst({
        where: {
          id: input.sprintId,
          organizationId: ctx.organization.id,
        },
        include: {
          project: { select: { id: true, key: true, name: true } },
          stories: {
            where: { archivedAt: null },
            select: { storyPoints: true, status: true },
          },
        },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });

      let board = await ctx.db.retroBoard.findUnique({
        where: { sprintId: input.sprintId },
        include: {
          cards: {
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!board) {
        board = await ctx.db.retroBoard.create({
          data: { sprintId: input.sprintId, status: "DRAFT" },
          include: {
            cards: {
              include: { author: { select: { id: true, name: true, avatarUrl: true } } },
              orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
            },
          },
        });
      }

      const totalPoints = sprint.stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
      const completedPoints = sprint.stories
        .filter((t) => t.status === "DONE")
        .reduce((s, t) => s + (t.storyPoints ?? 0), 0);

      return {
        board,
        sprint,
        velocity: { totalPoints, completedPoints },
      };
    }),

  addCard: orgProcedure
    .input(
      z.object({
        sprintId: z.string(),
        column: RETRO_COLUMN,
        content: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const sprint = await ctx.db.sprint.findFirst({
        where: { id: input.sprintId, organizationId: ctx.organization.id },
      });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });

      let board = await ctx.db.retroBoard.findUnique({
        where: { sprintId: input.sprintId },
      });
      if (!board) {
        board = await ctx.db.retroBoard.create({
          data: { sprintId: input.sprintId, status: "DRAFT" },
        });
      }

      return ctx.db.retroCard.create({
        data: {
          boardId: board.id,
          authorId: ctx.user.id,
          column: input.column,
          content: input.content.trim(),
        },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      });
    }),

  vote: orgProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.db.retroCard.findFirst({
        where: { id: input.cardId },
        include: { board: { include: { sprint: true } } },
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });
      if (card.board.sprint.organizationId !== ctx.organization.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (card.column === "ACTION_ITEM") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Action items cannot be voted on." });
      }
      return ctx.db.retroCard.update({
        where: { id: input.cardId },
        data: { votes: { increment: 1 } },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      });
    }),

  convertToTask: orgProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });
      const card = await ctx.db.retroCard.findFirst({
        where: { id: input.cardId },
        include: {
          board: { include: { sprint: { include: { project: true } } } },
        },
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });
      if (card.column !== "ACTION_ITEM") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only action items can be converted." });
      }
      if (card.convertedStoryId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already converted." });
      }

      const project = card.board.sprint.project;
      const backlogColumn = await ctx.db.boardColumn.findFirst({
        where: {
          projectId: project.id,
          boardType: "SPRINT_BOARD",
          colType: "BACKLOG",
        },
      });
      const targetColumnId =
        backlogColumn?.id ??
        (
          await ctx.db.boardColumn.findFirst({
            where: { projectId: project.id, boardType: "SPRINT_BOARD" },
          })
        )?.id;

      const [updatedProject, storyCount] = await Promise.all([
        ctx.db.project.update({
          where: { id: project.id },
          data: { storyCounter: { increment: 1 } },
        }),
        ctx.db.userStory.count({
          where: {
            projectId: project.id,
            columnId: targetColumnId ?? undefined,
          },
        }),
      ]);

      const story = await ctx.db.userStory.create({
        data: {
          number: updatedProject.storyCounter,
          title: card.content,
          status: "TODO",
          priority: "MEDIUM",
          position: storyCount,
          projectId: project.id,
          columnId: targetColumnId,
          sprintId: null,
          reporterId: ctx.user.id,
          organizationId: ctx.organization.id,
        },
      });

      await ctx.db.retroCard.update({
        where: { id: input.cardId },
        data: { convertedStoryId: story.id },
      });

      return { story, projectKey: project.key };
    }),
});
