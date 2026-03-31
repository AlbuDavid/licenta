import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as (JWT & { role?: "USER" | "ADMIN" }) | null;

    // Unauthenticated users are redirected by withAuth's `signIn` page config below.
    // Here we handle the authenticated-but-not-admin case.
    if (token && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Return false → withAuth redirects to the signIn page (unauthenticated).
      // Return true → our middleware function runs (authenticated, check role above).
      authorized: ({ token }) => token !== null,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
