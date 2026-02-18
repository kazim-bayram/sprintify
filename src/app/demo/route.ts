import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth";
import { seedDemoData } from "@/lib/demo-seeder";
import { db } from "@/server/db";

const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL ?? "kitom98633@bitoini.com";
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo1234";
const DEMO_RATE_LIMIT_PER_HOUR = 5;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (!DEMO_USER_EMAIL || !DEMO_USER_PASSWORD) {
      console.error("Demo sign-in failed: DEMO_USER_EMAIL or DEMO_USER_PASSWORD not configured");
      return NextResponse.redirect(new URL("/?demoError=1", request.url));
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });

    if (error) {
      console.error("Demo sign-in failed", error.message);
      return NextResponse.redirect(new URL("/?demoError=1", request.url));
    }
  }

  const appUser = await getCurrentUser();
  if (!appUser) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Rate limit: if this is the generic Demo User, block after 5 demo projects in the last hour
  if (appUser.email === DEMO_USER_EMAIL) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentDemos = await db.project.count({
      where: {
        isDemo: true,
        createdAt: { gte: oneHourAgo },
        organization: {
          memberships: {
            some: { userId: appUser.id },
          },
        },
      },
    });

    if (recentDemos >= DEMO_RATE_LIMIT_PER_HOUR) {
      return NextResponse.redirect(new URL("/?demoError=rateLimit", request.url));
    }
  }

  const { projectId, projectKey, demoExpiresAt } = await seedDemoData(appUser.id);

  const redirectUrl = new URL(`/projects/${projectKey.toLowerCase()}/timeline`, request.url);
  redirectUrl.searchParams.set("demo", "1");

  const res = NextResponse.redirect(redirectUrl);

  // Set cookies for demo UX: session flag and expiry for 24h countdown
  const expiresMs = demoExpiresAt ? new Date(demoExpiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000;
  res.cookies.set("demo_session", "1", {
    path: "/",
    maxAge: Math.max(0, Math.floor((expiresMs - Date.now()) / 1000)),
    httpOnly: false,
    sameSite: "lax",
  });
  res.cookies.set("demo_expires", String(expiresMs), {
    path: "/",
    maxAge: 24 * 60 * 60,
    httpOnly: false,
    sameSite: "lax",
  });

  return res;
}

