import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Period = "week" | "month" | "year" | "all";

function startDateFor(period: Period): Date | undefined {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (period === "year") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get("period") ?? "all";
  const period: Period = ["week", "month", "year", "all"].includes(raw)
    ? (raw as Period)
    : "all";

  try {
    const startDate = startDateFor(period);
    const result = await db.order.aggregate({
      where: {
        status: { not: "CANCELLED" },
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      _sum: { total: true },
    });

    return NextResponse.json({ revenue: result._sum.total ?? 0 });
  } catch (error) {
    console.error("[GET /api/admin/revenue]", error);
    return NextResponse.json({ error: "Eroare la calculul veniturilor." }, { status: 500 });
  }
}
