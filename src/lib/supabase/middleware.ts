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
          // Persist these cookie updates so we can also apply them to redirects.
          // (We can't rely on mutating request.cookies alone.)
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
  // A simple mistake could lead to very hard-to-debug auth issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect to sign-in if not authenticated
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up") ||
    request.nextUrl.pathname.startsWith("/auth");

  const isPublicRoute = request.nextUrl.pathname === "/" || isAuthRoute;

  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    cookiesToSetForResponse?.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return redirectWithCookies(url);
  }

  // If user is signed in and tries to access auth pages, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}
