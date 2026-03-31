import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ConfirmarePageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmarePage({ searchParams }: ConfirmarePageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/produse");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { customDesign: true } },
    },
  });

  if (!order) {
    redirect("/produse");
  }

  const orderIdShort = order.id.slice(-8).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Comanda a fost plasată!
        </h1>
        <p className="mt-2 text-slate-500">
          Mulțumim pentru comandă. Vei primi un email de confirmare la{" "}
          <strong className="text-slate-700">{order.customerEmail}</strong>.
        </p>
      </div>

      {/* Order details card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              Număr comandă
            </p>
            <p className="text-lg font-semibold text-slate-900 font-mono">
              #{orderIdShort}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              Metodă de plată
            </p>
            <p className="text-sm font-medium text-slate-900">
              {order.paymentMethod === "CASH_ON_DELIVERY"
                ? "Plată la livrare"
                : "Card online"}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Items */}
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-slate-900 font-medium">
                  {item.productName}
                </span>
                <span className="text-slate-400 ml-2">× {item.quantity}</span>
              </div>
              <span className="text-slate-700 font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <div className="flex justify-between text-sm text-slate-500">
          <span>Transport</span>
          <span className="text-green-600 font-medium">Gratuit</span>
        </div>

        <div className="flex justify-between font-semibold text-slate-900 text-lg mt-2">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Shipping details */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Package className="size-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Adresa de livrare
          </h2>
        </div>
        <div className="text-sm text-slate-600 space-y-0.5">
          <p className="font-medium text-slate-900">{order.customerName}</p>
          <p>{order.shippingAddress}</p>
          <p>
            {order.shippingCity}, {order.shippingCounty} {order.shippingPostal}
          </p>
          <p>{order.customerPhone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-slate-900 hover:bg-slate-700">
          <Link href="/comenzi">
            Urmărește comanda
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/produse">Continuă cumpărăturile</Link>
        </Button>
      </div>
    </div>
  );
}
