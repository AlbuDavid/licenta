import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as (JWT & { role?: "USER" | "ADMIN" }) | null;
    const { pathname } = req.nextUrl;

    // Admin routes: must be ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => token !== null,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/designs/:path*",
  ],
};
