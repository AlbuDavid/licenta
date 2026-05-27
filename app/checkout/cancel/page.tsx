"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Nu am putut iniția plata. Încearcă din nou.");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  void router;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <XCircle className="size-16 text-slate-300" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Plata a fost anulată</h1>
        <p className="text-slate-500 max-w-md">
          Comanda ta a fost salvată. Poți relua plata oricând sau poți abandona comanda.
        </p>
        {orderId && (
          <p className="text-sm text-slate-400 font-mono">ID: {orderId}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mt-2">
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/produse">Continuă cumpărăturile</Link>
        </Button>
        {orderId && (
          <Button
            disabled={loading}
            onClick={handleRetry}
            className="bg-slate-900 hover:bg-slate-700"
          >
            {loading ? "Se procesează..." : "Reia plata"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
