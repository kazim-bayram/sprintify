import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";
import { generateJoinCode } from "@/lib/constants";

export const organizationRouter = createTRPCRouter({
  /**
   * Get the current user's organizations.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.organization.findMany({
      where: {
        memberships: {
          some: { userId: ctx.user.id },
        },
      },
      include: {
        _count: {
          select: { projects: true, memberships: true },
        },
      },
    });
  }),

  /**
   * Create a new organization and add the creator as ADMIN.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        slug: z
          .string()
          .min(2, "Slug must be at least 2 characters")
          .max(50)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug must be lowercase alphanumeric with hyphens"
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is taken
      const existing = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `The slug "${input.slug}" is already taken.`,
        });
      }

      // Create org and membership in a transaction
      return ctx.db.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: input.name,
            slug: input.slug,
            joinCode: generateJoinCode(input.slug),
          },
        });

        await tx.membership.create({
          data: {
            userId: ctx.user.id,
            organizationId: org.id,
            role: "ADMIN",
          },
        });

        return org;
      });
    }),

  /**
   * Public lookup by join code — used during sign-up to validate team codes.
   */
  lookupByJoinCode: publicProcedure
    .input(z.object({ code: z.string().min(3).max(16) }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      const org = await ctx.db.organization.findFirst({
        where: { joinCode: code },
        select: { id: true, name: true, slug: true, joinCode: true },
      });

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team code not found. Please check and try again." });
      }

      return org;
    }),

  /**
   * Get members of the current organization.
   */
  getMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user is a member
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization." });
      }

      return ctx.db.membership.findMany({
        where: { organizationId: input.organizationId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),
});
