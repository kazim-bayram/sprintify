import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth";
import { seedDemoData } from "@/lib/demo-seeder";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Ensure we have a Supabase session; if not, sign in with demo credentials
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const demoEmail = "kitom98633@bitoini.com";
    const demoPassword = "demo1234";

    if (!demoEmail || !demoPassword) {
      console.error("Demo sign-in failed: DEMO_USER_EMAIL or DEMO_USER_PASSWORD not configured");
      return NextResponse.redirect(new URL("/?demoError=1", request.url));
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
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

  const { projectId, projectKey } = await seedDemoData(appUser.id);

  // Redirect to the Hybrid timeline view for the seeded project
  const redirectUrl = new URL(`/projects/${projectKey.toLowerCase()}/timeline`, request.url);
  redirectUrl.searchParams.set("demo", "1");

  return NextResponse.redirect(redirectUrl);
}

