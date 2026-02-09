import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getCurrentUser, getActiveOrganization } from "@/server/auth";
import { db } from "@/server/db";

/**
 * tRPC Context — created for each request.
 * Contains the DB client and optionally the authenticated user.
 */
export async function createTRPCContext() {
  const user = await getCurrentUser();
  const orgContext = user ? await getActiveOrganization() : null;

  return {
    db,
    user,
    organization: orgContext?.organization ?? null,
    role: orgContext?.role ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * tRPC initialization with superjson transformer for Date/Map/Set support.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/**
 * Reusable middleware and procedures.
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Public procedure — no auth required
export const publicProcedure = t.procedure;

// Auth middleware — ensures user is signed in
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in." });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Org middleware — ensures user has an active organization
const enforceOrg = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in." });
  }
  if (!ctx.organization) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "You must belong to an organization.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organization: ctx.organization,
      role: ctx.role!,
    },
  });
});

// Protected procedure — requires authentication
export const protectedProcedure = t.procedure.use(enforceAuth);

// Org-scoped procedure — requires auth + active organization
export const orgProcedure = t.procedure.use(enforceOrg);
