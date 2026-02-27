// app/proxy.ts
import { NextResponse, NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected routes
const isProtectedRoute = createRouteMatcher([
  "/home",
  "/meal",
  "/grocery",
  "/admin",
]);

// Public routes (skip auth)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect the routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Continue the request
  return NextResponse.next();
});

// Routes where the middleware runs
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Catch-all except _next/* and static files
    "/",
    "/(api|trpc)(.*)", // Apply to API and TRPC routes
  ],
};
