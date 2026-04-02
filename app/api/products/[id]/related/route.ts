import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const product = await db.product.findUniqueOrThrow({
      where: { id },
      select: { category: true },
    });

    const related = await db.product.findMany({
      where: {
        category: product.category,
        id: { not: id },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(related);
  } catch (error) {
    console.error("[GET /api/products/:id/related]", error);
    return NextResponse.json([], { status: 200 });
  }
}
