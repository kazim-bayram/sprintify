import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Garbage collector for ephemeral demo projects.
 * DELETE FROM Project WHERE isDemo = true AND demoExpiresAt < NOW()
 * Protect with CRON_SECRET so only the scheduler (Vercel Cron / Supabase Edge) can call.
 */
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
  return !!CRON_SECRET && secret === CRON_SECRET;
}

async function runCleanup() {
  const result = await db.project.deleteMany({
    where: {
      isDemo: true,
      demoExpiresAt: { lt: new Date() },
    },
  });
  return NextResponse.json({
    ok: true,
    deleted: result.count,
    message: `Cleaned up ${result.count} expired demo project(s).`,
  });
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await runCleanup();
  } catch (e) {
    console.error("cleanup-demos cron error:", e);
    return NextResponse.json(
      { error: "Cleanup failed", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await runCleanup();
  } catch (e) {
    console.error("cleanup-demos cron error:", e);
    return NextResponse.json(
      { error: "Cleanup failed", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
