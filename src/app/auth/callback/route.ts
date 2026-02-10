import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

/**
 * Auth callback handler.
 * After Supabase OAuth redirect, this route:
 * 1. Exchanges the auth code for a session
 * 2. Syncs the Supabase user to our users table
 * 3. Redirects to onboarding (if no org) or projects
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";
  const joinCode = searchParams.get("joinCode");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync Supabase user → our users table (upsert)
      const supabaseUser = data.user;
      const user = await db.user.upsert({
        where: { supabaseId: supabaseUser.id },
        create: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email ?? "",
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.user_metadata?.name ??
            supabaseUser.email?.split("@")[0] ??
            "User",
          avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
        },
        update: {
          email: supabaseUser.email ?? undefined,
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.user_metadata?.name ??
            undefined,
          avatarUrl: supabaseUser.user_metadata?.avatar_url ?? undefined,
        },
        include: {
          memberships: true,
        },
      });

      // If a joinCode was provided and user has no org yet, attach them to that organization
      if (user.memberships.length === 0 && joinCode) {
        const org = await db.organization.findFirst({
          where: { joinCode: joinCode.toUpperCase() },
        });

        if (org) {
          await db.membership.create({
            data: {
              userId: user.id,
              organizationId: org.id,
              role: "MEMBER",
            },
          });
        }
      }

      // Reload memberships to determine redirect
      const refreshed = await db.user.findUnique({
        where: { id: user.id },
        include: { memberships: true },
      });

      // If user still has no org, redirect to onboarding
      if (!refreshed || refreshed.memberships.length === 0) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
