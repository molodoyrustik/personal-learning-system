import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims() verifies the JWT locally (asymmetric signing key) instead of
  // calling Supabase Auth on every request like getUser() did, and still
  // refreshes the session cookies when the access token is about to expire.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = !!data?.claims;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
  // The email-confirmation link lands here before any session exists.
  const isAuthCallback = pathname.startsWith("/auth/");

  if (!isSignedIn && !isAuthPage && !isAuthCallback) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isSignedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // manifest.webmanifest is excluded because browsers fetch it without
    // cookies — the auth check would redirect it to /sign-in on every load.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
