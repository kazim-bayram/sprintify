import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

export const memberRouter = createTRPCRouter({
  /** List members of the current organization */
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.membership.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  /** Invite a user by email (creates user + membership if not exists) */
  invite: orgProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can invite members." });

      // Check if user exists
      let user = await ctx.db.user.findUnique({ where: { email: input.email } });

      // If user doesn't exist, create a placeholder (will be filled on OAuth)
      if (!user) {
        user = await ctx.db.user.create({
          data: {
            supabaseId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            email: input.email,
            name: input.email.split("@")[0],
          },
        });
      }

      // Check if already a member
      const existing = await ctx.db.membership.findUnique({
        where: {
          userId_organizationId: { userId: user.id, organizationId: ctx.organization.id },
        },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already a member." });
      }

      return ctx.db.membership.create({
        data: {
          userId: user.id,
          organizationId: ctx.organization.id,
          role: input.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
    }),

  /** Update a member's role */
  updateRole: orgProcedure
    .input(
      z.object({
        membershipId: z.string(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can change roles." });

      const membership = await ctx.db.membership.findFirst({
        where: { id: input.membershipId, organizationId: ctx.organization.id },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });

      // Prevent removing the last admin
      if (membership.role === "ADMIN" && input.role !== "ADMIN") {
        const adminCount = await ctx.db.membership.count({
          where: { organizationId: ctx.organization.id, role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the last admin.",
          });
        }
      }

      return ctx.db.membership.update({
        where: { id: input.membershipId },
        data: { role: input.role },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
    }),

  /** Remove a member from the organization */
  remove: orgProcedure
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can remove members." });

      const membership = await ctx.db.membership.findFirst({
        where: { id: input.membershipId, organizationId: ctx.organization.id },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });

      // Prevent self-removal if last admin
      if (membership.userId === ctx.user.id) {
        const adminCount = await ctx.db.membership.count({
          where: { organizationId: ctx.organization.id, role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove yourself as the last admin.",
          });
        }
      }

      await ctx.db.membership.delete({ where: { id: input.membershipId } });
      return { success: true };
    }),
});
