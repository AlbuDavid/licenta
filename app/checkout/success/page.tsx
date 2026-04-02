"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <CheckCircle2 className="size-16 text-green-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Comandă plasată cu succes!</h1>
        <p className="text-slate-500 max-w-md">
          Îți mulțumim pentru comandă. Vei primi un email de confirmare în curând.
        </p>
        {orderId && (
          <p className="text-sm text-slate-400 font-mono">
            ID comandă: {orderId}
          </p>
        )}
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
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
