import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body: { currentPassword?: string; newPassword?: string } = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Completează toate câmpurile." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Parola nouă trebuie să aibă cel puțin 8 caractere." },
        { status: 400 }
      );
    }

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user.password) {
      return NextResponse.json(
        { error: "Contul tău nu folosește autentificarea cu parolă." },
        { status: 400 }
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Parola curentă este incorectă." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/profile/password]", error);
    return NextResponse.json({ error: "Eroare la schimbarea parolei" }, { status: 500 });
  }
}
