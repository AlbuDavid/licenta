import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  isCustomizable?: boolean;
  active?: boolean;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { id } = await ctx.params;

  try {
    const body: UpdateProductBody = await req.json();
    const product = await db.product.update({ where: { id }, data: body });
    return NextResponse.json(product);
  } catch (error) {
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json({ error: "Eroare la actualizarea produsului." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { id } = await ctx.params;

  try {
    const orderCount = await db.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Produsul are comenzi asociate și nu poate fi șters. Dezactivează-l în schimb." },
        { status: 409 }
      );
    }
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/products/:id]", error);
    return NextResponse.json({ error: "Eroare la ștergerea produsului." }, { status: 500 });
  }
}
