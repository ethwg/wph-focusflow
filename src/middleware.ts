import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const isPublicRoute = createRouteMatcher([
  "/auth/login(.*)",
  "/auth/signup(.*)",
]);

const isTeamRoute = createRouteMatcher(["/dashboard/team(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Redirect root to dashboard for authenticated users
  if (request.nextUrl.pathname === "/") {
    const session = await auth();
    if (session.userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect team routes - only allow managers
  if (isTeamRoute(request)) {
    const session = await auth();

    if (session.userId) {
      try {
        // Get user's user_id from clerk_id
        const { data: userData, error: userError } = await supabaseAdmin
          .from("user_account")
          .select("user_id")
          .eq("clerk_id", session.userId)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user:", userError);
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Check if user is a manager of any team
        const { data: teams, error: teamError } = await supabaseAdmin
          .from("team")
          .select("team_id")
          .eq("manager_id", userData.user_id)
          .limit(1);

        if (teamError || !teams || teams.length === 0) {
          // User is not a manager, redirect to main dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (error) {
        console.error("Error checking manager status:", error);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
