import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { OrderStatus } from "@/lib/generated/prisma/client";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode; step: number }
> = {
  PENDING: {
    label: "În așteptare",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: <Clock className="size-4" />,
    step: 1,
  },
  PROCESSING: {
    label: "Se procesează",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <Settings className="size-4" />,
    step: 2,
  },
  SHIPPED: {
    label: "Expediată",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    icon: <Truck className="size-4" />,
    step: 3,
  },
  DELIVERED: {
    label: "Livrată",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle2 className="size-4" />,
    step: 4,
  },
  CANCELLED: {
    label: "Anulată",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="size-4" />,
    step: 0,
  },
};

const TIMELINE_STEPS = [
  { status: "PENDING" as OrderStatus, label: "Plasată" },
  { status: "PROCESSING" as OrderStatus, label: "Procesare" },
  { status: "SHIPPED" as OrderStatus, label: "Expediată" },
  { status: "DELIVERED" as OrderStatus, label: "Livrată" },
];

export default async function ComenziPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { customDesign: true, product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Comenzile mele
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {orders.length === 0
            ? "Nu ai nicio comandă încă."
            : `${orders.length} ${orders.length === 1 ? "comandă" : "comenzi"}`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package className="size-12 text-slate-200" />
          <p className="text-slate-500">Nu ai plasat nicio comandă.</p>
          <Button asChild variant="outline">
            <Link href="/produse">
              Explorează produsele
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            const orderIdShort = order.id.slice(-8).toUpperCase();
            const currentStep = config.step;

            return (
              <div
                key={order.id}
                className="rounded-lg border border-slate-200 bg-white overflow-hidden"
              >
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                        Comandă
                      </p>
                      <p className="text-sm font-semibold text-slate-900 font-mono">
                        #{orderIdShort}
                      </p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                        Data
                      </p>
                      <p className="text-sm text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.color}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Status timeline — only for non-cancelled orders */}
                {order.status !== "CANCELLED" && (
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      {TIMELINE_STEPS.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = currentStep > stepNumber;
                        const isCurrent = currentStep === stepNumber;
                        const isLast = index === TIMELINE_STEPS.length - 1;

                        return (
                          <div key={step.status} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex items-center justify-center size-8 rounded-full border-2 transition-colors ${
                                  isCompleted
                                    ? "bg-green-600 border-green-600 text-white"
                                    : isCurrent
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "bg-white border-slate-300 text-slate-400"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <span className="text-xs font-medium">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`mt-1.5 text-xs font-medium ${
                                  isCompleted || isCurrent
                                    ? "text-slate-900"
                                    : "text-slate-400"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            {!isLast && (
                              <div
                                className={`flex-1 h-0.5 mx-2 mb-5 ${
                                  isCompleted ? "bg-green-600" : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order items */}
                <div className="px-6 pb-4">
                  <Separator className="mb-3" />
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-3">
                        {item.product?.imageUrl && (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                            <img
                              src={item.product.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 truncate">
                            {item.productName}
                          </p>
                          {item.customDesign && (
                            <p className="text-xs text-amber-600">
                              Personalizat
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          × {item.quantity}
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
