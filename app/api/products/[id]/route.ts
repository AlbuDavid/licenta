import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const product = await db.product.findUniqueOrThrow({ where: { id } });
    return NextResponse.json(product);
  } catch (error) {
    console.error("[GET /api/products/:id]", error);
    return NextResponse.json({ error: "Produsul nu a fost găsit." }, { status: 404 });
  }
}
