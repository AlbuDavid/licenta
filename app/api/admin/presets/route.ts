import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const presets = await db.presetDesign.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(presets);
  } catch (error) {
    console.error("[GET /api/admin/presets]", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}

interface CreatePresetBody {
  name: string;
  category: string;
  svgContent: string;
  sortOrder?: number;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreatePresetBody = await request.json();
    const { name, category, svgContent, sortOrder = 0 } = body;

    const preset = await db.presetDesign.create({
      data: {
        name,
        category,
        svgContent,
        sortOrder,
        active: true,
      },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/presets]", error);
    return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
  }
}
