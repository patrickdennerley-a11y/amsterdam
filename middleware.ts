import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/callback"];

// Admin-only routes
const adminRoutes = ["/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith("/callback"))) {
    // If user is logged in and visiting public routes (except landing),
    // redirect to appropriate page
    if (pathname === "/login" || pathname === "/signup") {
      const { user, supabaseResponse, supabase } = await updateSession(request);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status, current_match_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          switch (profile.status) {
            case "onboarding":
              return NextResponse.redirect(new URL("/onboarding", request.url));
            case "waiting":
              return NextResponse.redirect(new URL("/dashboard", request.url));
            case "matched":
              return NextResponse.redirect(
                new URL(`/chat/${profile.current_match_id}`, request.url)
              );
          }
        }
      }

      return supabaseResponse;
    }

    return NextResponse.next();
  }

  // Protected routes - require authentication
  const { user, supabaseResponse, supabase } = await updateSession(request);

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Get user profile to check status
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, current_match_id")
    .eq("id", user.id)
    .single();

  // Redirect based on user status
  if (profile) {
    const { status, current_match_id } = profile;

    // Prevent users from accessing pages that don't match their status
    if (pathname.startsWith("/onboarding") && status !== "onboarding") {
      if (status === "waiting") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (status === "matched") {
        return NextResponse.redirect(
          new URL(`/chat/${current_match_id}`, request.url)
        );
      }
    }

    if (pathname.startsWith("/dashboard") && status !== "waiting") {
      if (status === "onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      if (status === "matched") {
        return NextResponse.redirect(
          new URL(`/chat/${current_match_id}`, request.url)
        );
      }
    }

    if (pathname.startsWith("/chat") && status !== "matched") {
      if (status === "onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      if (status === "waiting") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
