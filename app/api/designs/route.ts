import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── POST /api/designs ─────────────────────────────────────────────────────────

interface SaveDesignBody {
  name?: string;
  canvasJson: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const body = await req.json() as SaveDesignBody;
    if (!body.canvasJson) {
      return NextResponse.json({ error: "canvasJson este obligatoriu" }, { status: 400 });
    }

    const design = await db.design.create({
      data: {
        userId:    session.user.id,
        name:      body.name ?? "Design fără titlu",
        canvasJson: body.canvasJson,
      },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ design }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/designs]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ── GET /api/designs ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const designs = await db.design.findMany({
      where:   { userId: session.user.id },
      select:  { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ designs });
  } catch (error) {
    console.error("[GET /api/designs]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
