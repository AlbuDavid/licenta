import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

async function SuccessContent({ searchParams }: PageProps) {
  const { orderId } = await searchParams;

  if (!orderId) notFound();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentMethod: true,
      paymentStatus: true,
      customerName: true,
      total: true,
    },
  });

  if (!order) notFound();

  const isCOD = order.paymentMethod === "CASH_ON_DELIVERY";
  const isPaid = order.paymentStatus === "PAID";
  const isFailed = order.paymentStatus === "FAILED";

  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
        <XCircle className="size-16 text-red-400" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Plata a eșuat</h1>
          <p className="text-slate-500 max-w-md">
            Comanda a fost salvată, dar plata nu a fost procesată.
          </p>
          <p className="text-sm text-slate-400 font-mono">ID: {orderId}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/checkout/cancel?orderId=${orderId}`}>Reia plata</Link>
          </Button>
          <Button asChild className="bg-slate-900 hover:bg-slate-700">
            <Link href="/produse">Continuă cumpărăturile</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isCOD && !isPaid) {
    // CARD + still PENDING — webhook hasn't arrived yet
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
        <Clock className="size-16 text-amber-400 animate-pulse" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Procesăm plata...</h1>
          <p className="text-slate-500 max-w-md">
            Plata este în curs de confirmare. Vei primi un email când este procesată.
          </p>
          <p className="text-sm text-slate-400 font-mono">ID: {orderId}</p>
        </div>
        <Button asChild className="bg-slate-900 hover:bg-slate-700">
          <Link href="/">Acasă</Link>
        </Button>
      </div>
    );
  }

  // COD or CARD+PAID — success
  return (
    <>
      {/* Clear cart only after confirmed order */}
      <ClearCartOnMount />
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
        <CheckCircle2 className="size-16 text-green-500" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isCOD ? "Comandă plasată cu succes!" : "Plată confirmată!"}
          </h1>
          <p className="text-slate-500 max-w-md">
            {isCOD
              ? "Îți mulțumim! Vei plăti la livrare. Un email de confirmare a fost trimis."
              : "Plata a fost procesată. Un email de confirmare a fost trimis."}
          </p>
          <p className="text-sm text-slate-400 font-mono">ID: {orderId}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/produse">Continuă cumpărăturile</Link>
          </Button>
          <Button asChild className="bg-slate-900 hover:bg-slate-700">
            <Link href="/">Acasă</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage(props: PageProps) {
  return (
    <Suspense>
      <SuccessContent {...props} />
    </Suspense>
  );
}
