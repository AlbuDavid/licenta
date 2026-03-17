import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/error?error=MissingToken", req.url));
  }

  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/auth/error?error=InvalidToken", req.url));
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/auth/error?error=ExpiredToken", req.url));
    }

    // Mark email as verified
    await db.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    // Remove used token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
  } catch (error) {
    console.error("[GET /api/auth/verify]", error);
    return NextResponse.redirect(new URL("/auth/error?error=ServerError", req.url));
  }
}
