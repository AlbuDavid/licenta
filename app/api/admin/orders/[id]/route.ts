import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const VALID_STATUSES = new Set<string>(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

interface UpdateOrderBody {
  status: string;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { id } = await ctx.params;

  try {
    const body: UpdateOrderBody = await req.json();
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Status invalid." }, { status: 400 });
    }
    const order = await db.order.update({
      where: { id },
      data: { status: body.status as OrderStatus },
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error("[PATCH /api/admin/orders/:id]", error);
    return NextResponse.json({ error: "Eroare la actualizarea comenzii." }, { status: 500 });
  }
}
