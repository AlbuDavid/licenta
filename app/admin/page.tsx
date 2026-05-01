export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Package,
  Sparkles,
  ShoppingCart,
  Clock,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { OrderStatus } from "@/components/admin/StatusBadge";
import { RevenueChart } from "@/components/admin/RevenueChart";
import type { DayRevenue } from "@/components/admin/RevenueChart";

interface DashboardStats {
  totalProducts: number;
  activePresets: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  itemsCount: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
}

async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  revenueByDay: DayRevenue[];
  topProducts: TopProduct[];
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activePresets,
      totalOrders,
      pendingOrders,
      revenueAgg,
      recent,
      recentForChart,
      topItemsRaw,
    ] = await Promise.all([
      db.product.count(),
      db.presetDesign.count({ where: { active: true } }),
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      db.order.findMany({
        where: {
          status: { not: "CANCELLED" },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      }),
      db.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Build 30-day chart data (fill missing days with 0)
    const revenueMap = new Map<string, number>();
    for (const order of recentForChart) {
      const label = new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
      }).format(order.createdAt);
      revenueMap.set(label, (revenueMap.get(label) ?? 0) + order.total);
    }
    const revenueByDay: DayRevenue[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
      }).format(d);
      revenueByDay.push({
        date: label,
        revenue: Math.round((revenueMap.get(label) ?? 0) * 100) / 100,
      });
    }

    const topProducts: TopProduct[] = topItemsRaw.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalSold: r._sum.quantity ?? 0,
    }));

    return {
      stats: {
        totalProducts,
        activePresets,
        totalOrders,
        pendingOrders,
        totalRevenue: revenueAgg._sum.total ?? 0,
      },
      recentOrders: recent.map((o) => ({
        id: o.id,
        customerName: o.customerName,
        total: o.total,
        status: o.status as OrderStatus,
        createdAt: o.createdAt,
        itemsCount: o._count.items,
      })),
      revenueByDay,
      topProducts,
    };
  } catch (error) {
    console.error("[GET /admin]", error);
    return {
      stats: {
        totalProducts: 0,
        activePresets: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
      },
      recentOrders: [],
      revenueByDay: [],
      topProducts: [],
    };
  }
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: typeof Package;
  href: string;
  accent?: "default" | "amber" | "emerald";
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent = "default",
}: StatCardProps) {
  const iconCls =
    accent === "amber"
      ? "flex size-10 items-center justify-center rounded-md bg-amber-100 text-amber-700"
      : accent === "emerald"
        ? "flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700"
        : "flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700";

  return (
    <Link href={href} className="group">
      <Card className="transition-shadow group-hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={iconCls}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-snug">
              {value}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default async function AdminDashboardPage() {
  const { stats, recentOrders, revenueByDay, topProducts } =
    await getDashboardData();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
          Administrare
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Tablou de bord</h1>
        <p className="text-sm text-slate-600 mt-1">
          Privire de ansamblu asupra magazinului
        </p>
      </div>

      {/* Stat cards — 5 columns on large screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Produse"
          value={stats.totalProducts}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          label="Preset-uri active"
          value={stats.activePresets}
          icon={Sparkles}
          href="/admin/presets"
        />
        <StatCard
          label="Comenzi totale"
          value={stats.totalOrders}
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <StatCard
          label="În așteptare"
          value={stats.pendingOrders}
          icon={Clock}
          href="/admin/orders?status=PENDING"
          accent="amber"
        />
        <StatCard
          label="Venituri totale"
          value={formatPrice(stats.totalRevenue)}
          icon={TrendingUp}
          href="/admin/orders"
          accent="emerald"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Venituri — ultimele 30 de zile
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 pb-3">
          <RevenueChart data={revenueByDay} />
        </CardContent>
      </Card>

      {/* Bottom row: top products + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 produse vândute</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                Nicio vânzare înregistrată.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topProducts.map((p, idx) => (
                  <li
                    key={p.productId}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="w-5 text-xs font-bold text-slate-400 tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-800 truncate">
                      {p.productName}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
                      {p.totalSold} buc.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Comenzi recente</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">Vezi toate</Link>
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                Nicio comandă încă.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href="/admin/orders"
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-slate-900 truncate">
                            {order.customerName}
                          </p>
                          <span className="text-xs text-slate-400 shrink-0">
                            #{order.id.slice(-8)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(order.createdAt)} · {order.itemsCount}{" "}
                          {order.itemsCount === 1 ? "produs" : "produse"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={order.status} />
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
