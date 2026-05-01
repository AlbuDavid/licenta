import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, status: true },
        },
      },
    });

    const result = users.map((u) => {
      const totalSpent = u.orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
        createdAt: u.createdAt,
        orderCount: u._count.orders,
        totalSpent,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: "Eroare la listarea utilizatorilor." }, { status: 500 });
  }
}
