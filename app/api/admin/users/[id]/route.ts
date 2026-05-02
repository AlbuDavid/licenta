import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface UpdateUserBody {
  role: Role;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { id } = await ctx.params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Nu îți poți modifica propriul rol." },
      { status: 400 },
    );
  }

  try {
    const body: UpdateUserBody = await req.json();
    if (body.role !== "USER" && body.role !== "ADMIN") {
      return NextResponse.json({ error: "Rol invalid." }, { status: 400 });
    }
    const user = await db.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[PATCH /api/admin/users/:id]", error);
    return NextResponse.json({ error: "Eroare la actualizarea utilizatorului." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { id } = await ctx.params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Nu îți poți șterge propriul cont." },
      { status: 400 },
    );
  }

  try {
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error);
    return NextResponse.json({ error: "Eroare la ștergerea utilizatorului." }, { status: 500 });
  }
}
