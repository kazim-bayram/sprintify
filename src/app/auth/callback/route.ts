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

      // If user has no org, redirect to onboarding
      if (user.memberships.length === 0) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
