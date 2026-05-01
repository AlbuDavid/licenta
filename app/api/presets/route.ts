import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    const presets = await db.presetDesign.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        svgContent: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(presets)
  } catch (error) {
    console.error("[GET /api/presets]", error)
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 })
  }
}
