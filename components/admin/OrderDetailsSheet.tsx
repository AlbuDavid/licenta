"use client";

import { useTransition } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus } from "@/app/admin/comenzi/actions";
import type { OrderStatus } from "@/lib/generated/prisma/client";

interface OrderCustomDesign {
  id: string;
  fileUrl: string;
  fileName: string;
}

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  customDesign: OrderCustomDesign | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
  items: OrderItem[];
}

interface Props {
  order: Order;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function downloadFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function OrderDetailsSheet({ order }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus as OrderStatus);
      } catch {
        // Error is logged server-side; surface could be enhanced with a toast
      }
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white"
        >
          View Order
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full border-slate-800 bg-slate-900 text-white sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="border-b border-slate-800 pb-4">
          <SheetTitle className="text-white">
            Order #{order.id.slice(-8).toUpperCase()}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-slate-800 p-3">
              <p className="text-xs text-slate-500">Customer</p>
              <p className="mt-1 text-sm font-medium text-white">
                {order.user?.name ?? order.user?.email ?? "Guest"}
              </p>
              {order.user?.name && (
                <p className="text-xs text-slate-400">{order.user.email}</p>
              )}
            </div>
            <div className="rounded-md bg-slate-800 p-3">
              <p className="text-xs text-slate-500">Order Total</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          {/* Status update */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </p>
            <Select
              defaultValue={order.status}
              onValueChange={handleStatusChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white focus:ring-slate-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800 text-white">
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="focus:bg-slate-700 focus:text-white"
                  >
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPending && (
              <p className="text-xs text-slate-500">Updating status…</p>
            )}
          </div>

          {/* Order items */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Items ({order.items.length})
            </p>

            <ul className="space-y-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-slate-800 bg-slate-800/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatPrice(item.price)} × {item.quantity} ={" "}
                        <span className="text-slate-300">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Custom design download */}
                  {item.customDesign && (
                    <div className="mt-3 rounded-md border border-emerald-800/50 bg-emerald-950/30 p-2.5">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Custom laser design attached
                      </p>
                      <p className="mb-2 truncate text-xs text-slate-400">
                        {item.customDesign.fileName}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 bg-emerald-700 px-3 text-xs text-white hover:bg-emerald-600"
                          onClick={() =>
                            downloadFile(
                              item.customDesign!.fileUrl,
                              item.customDesign!.fileName
                            )
                          }
                        >
                          <Download size={12} />
                          Download Laser File
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1.5 px-2 text-xs text-slate-400 hover:text-white"
                          onClick={() =>
                            window.open(item.customDesign!.fileUrl, "_blank")
                          }
                        >
                          <ExternalLink size={12} />
                          Preview
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
