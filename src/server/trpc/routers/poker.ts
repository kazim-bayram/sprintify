import { z } from "zod";
import { createTRPCRouter, orgProcedure, publicProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { generateAccessCode } from "@/lib/constants";

export const pokerRouter = createTRPCRouter({
  /** Create a new estimation session (requires auth) */
  createSession: orgProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(100).default("Estimation Session"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "VIEWER") throw new TRPCError({ code: "FORBIDDEN" });

      // Generate unique access code
      let accessCode = generateAccessCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.estimationSession.findUnique({ where: { accessCode } });
        if (!existing) break;
        accessCode = generateAccessCode();
        attempts++;
      }

      const session = await ctx.db.estimationSession.create({
        data: {
          name: input.name,
          accessCode,
          projectId: input.projectId,
          organizationId: ctx.organization.id,
          hostUserId: ctx.user.id,
        },
      });

      // Auto-add host as participant
      await ctx.db.estimationParticipant.create({
        data: {
          name: ctx.user.name ?? ctx.user.email,
          isHost: true,
          userId: ctx.user.id,
          sessionId: session.id,
        },
      });

      return session;
    }),

  /** Get session by access code (public — guests can access) */
  getByCode: publicProcedure
    .input(z.object({ accessCode: z.string().min(4).max(10) }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({
        where: { accessCode: input.accessCode.toUpperCase() },
        include: {
          project: { select: { id: true, name: true, key: true } },
          hostUser: { select: { id: true, name: true, avatarUrl: true } },
          participants: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, isHost: true, userId: true, guestId: true },
          },
          votes: {
            where: { storyId: undefined },
            select: { id: true, value: true, participantId: true, storyId: true },
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });

      // Get active story if set
      let activeStory = null;
      if (session.activeStoryId) {
        activeStory = await ctx.db.userStory.findUnique({
          where: { id: session.activeStoryId },
          select: {
            id: true, number: true, title: true, description: true,
            priority: true, department: true, storyPoints: true,
            userBusinessValue: true, timeCriticality: true, riskReduction: true, jobSize: true,
          },
        });
      }

      // Get votes for active story
      let votes: { id: string; value: number; participantId: string }[] = [];
      if (session.activeStoryId) {
        votes = await ctx.db.estimationVote.findMany({
          where: { sessionId: session.id, storyId: session.activeStoryId },
          select: { id: true, value: true, participantId: true },
        });
      }

      return { ...session, activeStory, votes };
    }),

  /** Join session as guest (public) */
  joinAsGuest: publicProcedure
    .input(z.object({
      accessCode: z.string(),
      guestName: z.string().min(1).max(50),
      guestId: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({
        where: { accessCode: input.accessCode.toUpperCase() },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });

      // Upsert participant by guestId
      const participant = await ctx.db.estimationParticipant.upsert({
        where: { sessionId_guestId: { sessionId: session.id, guestId: input.guestId } },
        create: {
          name: input.guestName,
          guestId: input.guestId,
          sessionId: session.id,
        },
        update: { name: input.guestName },
      });

      return { participant, sessionId: session.id };
    }),

  /** Join session as authenticated user (requires auth) */
  joinAsUser: orgProcedure
    .input(z.object({ accessCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({
        where: { accessCode: input.accessCode.toUpperCase() },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      // Check if already joined
      const existing = await ctx.db.estimationParticipant.findFirst({
        where: { sessionId: session.id, userId: ctx.user.id },
      });
      if (existing) return { participant: existing, sessionId: session.id };

      const participant = await ctx.db.estimationParticipant.create({
        data: {
          name: ctx.user.name ?? ctx.user.email,
          userId: ctx.user.id,
          sessionId: session.id,
        },
      });

      return { participant, sessionId: session.id };
    }),

  /** Host: Select active story for voting */
  selectStory: orgProcedure
    .input(z.object({ sessionId: z.string(), storyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({ where: { id: input.sessionId } });
      if (!session || session.hostUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Clear existing votes for this story in this session
      await ctx.db.estimationVote.deleteMany({
        where: { sessionId: input.sessionId, storyId: input.storyId },
      });

      return ctx.db.estimationSession.update({
        where: { id: input.sessionId },
        data: { activeStoryId: input.storyId, status: "VOTING" },
      });
    }),

  /** Host: Change voting type */
  setVotingType: orgProcedure
    .input(z.object({
      sessionId: z.string(),
      votingType: z.enum(["EFFORT", "VALUE", "TIME", "RISK"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({ where: { id: input.sessionId } });
      if (!session || session.hostUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.estimationSession.update({
        where: { id: input.sessionId },
        data: { votingType: input.votingType },
      });
    }),

  /** Submit a vote (public — guests can vote) */
  vote: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      participantId: z.string(),
      storyId: z.string(),
      value: z.number().int().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({ where: { id: input.sessionId } });
      if (!session || session.status !== "VOTING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Voting is not active." });

      return ctx.db.estimationVote.upsert({
        where: {
          participantId_sessionId_storyId: {
            participantId: input.participantId,
            sessionId: input.sessionId,
            storyId: input.storyId,
          },
        },
        create: {
          value: input.value,
          participantId: input.participantId,
          sessionId: input.sessionId,
          storyId: input.storyId,
        },
        update: { value: input.value },
      });
    }),

  /** Host: Reveal votes */
  reveal: orgProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({ where: { id: input.sessionId } });
      if (!session || session.hostUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.estimationSession.update({
        where: { id: input.sessionId },
        data: { status: "REVEALED" },
      });
    }),

  /** Host: Apply the consensus/average score to the story */
  applyScore: orgProcedure
    .input(z.object({
      sessionId: z.string(),
      storyId: z.string(),
      value: z.number().int().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({ where: { id: input.sessionId } });
      if (!session || session.hostUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Map voting type to the correct story field
      const fieldMap: Record<string, string> = {
        EFFORT: "jobSize",
        VALUE: "userBusinessValue",
        TIME: "timeCriticality",
        RISK: "riskReduction",
      };
      const field = fieldMap[session.votingType];
      if (!field) throw new TRPCError({ code: "BAD_REQUEST" });

      // Also set storyPoints if voting on EFFORT
      const updateData: Record<string, number> = { [field]: input.value };
      if (session.votingType === "EFFORT") {
        updateData.storyPoints = input.value;
      }

      await ctx.db.userStory.update({
        where: { id: input.storyId },
        data: updateData,
      });

      // Reset to WAITING for next story
      await ctx.db.estimationSession.update({
        where: { id: input.sessionId },
        data: { status: "WAITING", activeStoryId: null },
      });

      return { success: true };
    }),

  /** Get backlog stories for the session's project (for host to pick from) */
  getBacklog: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.estimationSession.findUnique({
        where: { id: input.sessionId },
        select: { projectId: true },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.userStory.findMany({
        where: { projectId: session.projectId, archivedAt: null },
        orderBy: [{ position: "asc" }],
        select: {
          id: true, number: true, title: true, priority: true, department: true,
          storyPoints: true, userBusinessValue: true, timeCriticality: true,
          riskReduction: true, jobSize: true,
        },
        take: 100,
      });
    }),
});
