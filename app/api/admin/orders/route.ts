import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/client";

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const VALID_STATUSES = new Set<string>(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statusFilter = statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as OrderStatus) : undefined;

  try {
    const orders = await db.order.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            customDesign: { select: { fileUrl: true, fileName: true } },
          },
        },
      },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json({ error: "Eroare la listarea comenzilor." }, { status: 500 });
  }
}
