import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { cache } from "react";

/**
 * Get the currently authenticated user from Supabase + our DB.
 * Cached per request to avoid multiple DB hits.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const user = await db.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  // If the database was reset, the Supabase session cookie can still be valid
  // but our `users` table may not have a row yet. Auto-provision it to avoid
  // redirect loops (e.g. /projects -> /sign-in -> /projects ...).
  if (!user) {
    const email =
      supabaseUser.email ?? `${supabaseUser.id}@user.local`; // fallback for providers without email

    return await db.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email,
        name:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseUser.user_metadata as any)?.full_name ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabaseUser.user_metadata as any)?.name ??
          email.split("@")[0] ??
          "User",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avatarUrl: (supabaseUser.user_metadata as any)?.avatar_url ?? null,
      },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  return user;
});

/**
 * Get user or throw — for use in protected Server Actions / tRPC procedures.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Get the user's active organization. For MVP, returns the first org.
 * Later this can be based on a cookie/header for org switching.
 */
export async function getActiveOrganization() {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) return null;
  return {
    organization: membership.organization,
    role: membership.role,
    membership,
  };
}
