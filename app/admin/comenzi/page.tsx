import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderDetailsSheet } from "@/components/admin/OrderDetailsSheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { OrderStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-950 text-yellow-400",
  PROCESSING: "bg-blue-950 text-blue-400",
  SHIPPED: "bg-indigo-950 text-indigo-400",
  DELIVERED: "bg-emerald-950 text-emerald-400",
  CANCELLED: "bg-red-950 text-red-400",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AdminComenziPage() {
  const orders = await db.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: true,
          customDesign: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Orders</h1>
        <p className="mt-1 text-sm text-slate-400">
          {orders.length} order{orders.length !== 1 ? "s" : ""} total.
        </p>
      </div>

      {/* Orders table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Order ID</TableHead>
              <TableHead className="text-slate-400">Date</TableHead>
              <TableHead className="text-slate-400">Customer</TableHead>
              <TableHead className="text-slate-400">Total</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-slate-800 hover:bg-slate-800/50"
                >
                  {/* Order ID */}
                  <TableCell className="font-mono text-xs text-slate-300">
                    #{order.id.slice(-8).toUpperCase()}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <p className="text-sm text-white">
                      {order.user?.name ?? "Guest"}
                    </p>
                    {order.user?.email && (
                      <p className="text-xs text-slate-400">{order.user.email}</p>
                    )}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-sm text-slate-300">
                    {formatPrice(order.total)}
                  </TableCell>

                  {/* Status badge */}
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <OrderDetailsSheet order={order} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
