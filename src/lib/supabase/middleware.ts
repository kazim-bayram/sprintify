import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // We must ensure that any cookies Supabase wants to set are applied to
  // BOTH NextResponse.next() and any redirects we return. Otherwise browsers
  // (notably Firefox) can get stuck in an auth redirect loop.
  let supabaseResponse = NextResponse.next({ request });
  let cookiesToSetForResponse:
    | Array<{ name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }>
    | null = null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSetForResponse = cookiesToSet.map(({ name, value, options }) => ({
            name,
            value,
            options,
          }));

          supabaseResponse = NextResponse.next({ request });
          cookiesToSetForResponse.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Do NOT run any logic between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth routes (sign-in, sign-up, callback)
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/auth");

  // Public routes that don't require authentication:
  // - / (landing page — shows "Go to Dashboard" if logged in)
  // - /sign-in, /sign-up, /auth/*
  // - /poker/* (guest access for planning poker rooms)
  // - /onboarding
  const isPublicRoute =
    pathname === "/" ||
    isAuthRoute ||
    pathname.startsWith("/poker") ||
    pathname === "/onboarding";

  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    cookiesToSetForResponse?.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  // Not logged in + trying to access a protected route → sign-in
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return redirectWithCookies(url);
  }

  // Logged in + trying to access auth pages → redirect to projects
  // (but NOT from / — logged-in users should still see the landing page)
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}
