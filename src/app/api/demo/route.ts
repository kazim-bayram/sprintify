import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { seedGhostDemo } from "@/lib/ghost-demo-seeder";

const GHOST_PASSWORD = "DemoPass123!";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const timestamp = Date.now();
  const email = `demo-${timestamp}@sprintify.org`;

  // 1. Sign up ghost user (email confirmation disabled → session set immediately)
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: GHOST_PASSWORD,
    options: {
      emailRedirectTo: undefined,
      data: { name: "Demo User" },
    },
  });

  if (signUpError) {
    console.error("[api/demo] signUp failed:", signUpError.message);
    return NextResponse.redirect(new URL("/?demoError=auth", request.url));
  }

  const supabaseUser = authData.user;
  if (!supabaseUser) {
    console.error("[api/demo] signUp succeeded but no user returned");
    return NextResponse.redirect(new URL("/?demoError=auth", request.url));
  }

  // 2. Upsert our User (prisma) so we have userId for seeding
  const appUser = await db.user.upsert({
    where: { supabaseId: supabaseUser.id },
    create: {
      supabaseId: supabaseUser.id,
      email,
      name: "Demo User",
    },
    update: { email },
  });

  // 3. Create Organization + Membership + Seed project (strict order for FK constraints)
  const orgSlug = `acme-demo-${timestamp}`;
  const org = await db.organization.create({
    data: {
      name: "Acme Corp (Demo)",
      slug: orgSlug,
      joinCode: `DEMO-${timestamp.toString(36).toUpperCase().slice(-6)}`,
    },
  });

  await db.membership.create({
    data: {
      userId: appUser.id,
      organizationId: org.id,
      role: "ADMIN",
    },
  });

  let projectKey: string;
  let demoExpiresAt: Date;

  try {
    const result = await seedGhostDemo(appUser.id, org.id);
    projectKey = result.projectKey;
    demoExpiresAt = result.demoExpiresAt;
  } catch (e) {
    console.error("[api/demo] seed failed:", e);
    return NextResponse.redirect(new URL("/?demoError=seed", request.url));
  }

  // 4. Redirect to timeline
  const redirectUrl = new URL(
    `/projects/${projectKey.toLowerCase()}/timeline`,
    request.url
  );
  redirectUrl.searchParams.set("demo", "1");

  const res = NextResponse.redirect(redirectUrl);

  const expiresMs = demoExpiresAt.getTime();
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
