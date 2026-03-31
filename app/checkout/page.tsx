"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Truck,
  CreditCard,
  Banknote,
  Loader2,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import Link from "next/link";

function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} RON`;
}

interface ShippingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCounty: string;
  shippingPostal: string;
}

type PaymentMethod = "CASH_ON_DELIVERY" | "CARD";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();

  const [form, setForm] = useState<ShippingForm>({
    customerName: session?.user?.name ?? "",
    customerEmail: session?.user?.email ?? "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCounty: "",
    shippingPostal: "",
  });

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to products if cart is empty
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">Coșul tău este gol.</p>
        <Button asChild variant="outline">
          <Link href="/produse">Mergi la produse</Link>
        </Button>
      </div>
    );
  }

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    form.customerPhone.trim() &&
    form.shippingAddress.trim() &&
    form.shippingCity.trim() &&
    form.shippingCounty.trim() &&
    form.shippingPostal.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            customDesign: item.customDesign
              ? {
                  fileUrl: item.customDesign.fileUrl,
                  fileName: item.customDesign.fileName,
                }
              : undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string; detail?: string };
        throw new Error(data.detail || data.error || "Eroare la plasarea comenzii.");
      }

      const { orderId } = (await res.json()) as { orderId: string };

      if (paymentMethod === "CARD") {
        // Redirect to Stripe Checkout
        const stripeRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        if (!stripeRes.ok) {
          throw new Error("Eroare la inițializarea plății cu cardul.");
        }

        const { url } = (await stripeRes.json()) as { url: string };
        clearCart();
        window.location.href = url;
        return;
      }

      // Cash on delivery → go to confirmation
      clearCart();
      router.push(`/checkout/confirmare?orderId=${orderId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare necunoscută.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/produse"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Înapoi la produse
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          Finalizează comanda
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Shipping details */}
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="size-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Detalii livrare
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nume complet *</Label>
                  <Input
                    id="customerName"
                    placeholder="Ion Popescu"
                    value={form.customerName}
                    onChange={(e) =>
                      updateField("customerName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="ion@exemplu.ro"
                    value={form.customerEmail}
                    onChange={(e) =>
                      updateField("customerEmail", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerPhone">Telefon *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={form.customerPhone}
                    onChange={(e) =>
                      updateField("customerPhone", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingAddress">Adresă *</Label>
                  <Input
                    id="shippingAddress"
                    placeholder="Str. Exemplu, Nr. 10, Bl. A, Sc. 1, Ap. 5"
                    value={form.shippingAddress}
                    onChange={(e) =>
                      updateField("shippingAddress", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCity">Oraș *</Label>
                  <Input
                    id="shippingCity"
                    placeholder="București"
                    value={form.shippingCity}
                    onChange={(e) =>
                      updateField("shippingCity", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCounty">Județ *</Label>
                  <Input
                    id="shippingCounty"
                    placeholder="București"
                    value={form.shippingCounty}
                    onChange={(e) =>
                      updateField("shippingCounty", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingPostal">Cod poștal *</Label>
                  <Input
                    id="shippingPostal"
                    placeholder="010101"
                    value={form.shippingPostal}
                    onChange={(e) =>
                      updateField("shippingPostal", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="size-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Metodă de plată
                </h2>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(val) =>
                  setPaymentMethod(val as PaymentMethod)
                }
                className="gap-3"
              >
                <label
                  htmlFor="cod"
                  className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
                  <Banknote className="size-5 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Plată la livrare (Ramburs)
                    </p>
                    <p className="text-xs text-slate-500">
                      Plătești cash sau cu cardul la curier
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="card"
                  className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "CARD"
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <RadioGroupItem value="CARD" id="card" />
                  <CreditCard className="size-5 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Plată cu cardul online
                    </p>
                    <p className="text-xs text-slate-500">
                      Visa, Mastercard — plată securizată prin Stripe
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </section>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit — visible on mobile */}
            <div className="lg:hidden">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-700 h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Se procesează...
                  </>
                ) : paymentMethod === "CARD" ? (
                  `Plătește ${formatPrice(totalPrice())}`
                ) : (
                  `Plasează comanda — ${formatPrice(totalPrice())}`
                )}
              </Button>
            </div>
          </div>

          {/* Right column — Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Sumar comandă
              </h2>

              <ul className="space-y-3 mb-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      {item.customDesign && (
                        <div className="absolute top-0 right-0 bg-amber-500 rounded-bl p-0.5">
                          <Paperclip className="size-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-900 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Transport</span>
                  <span className="text-green-600 font-medium">Gratuit</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-slate-900 text-lg">
                <span>Total</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>

              {/* Submit — visible on desktop */}
              <div className="hidden lg:block mt-6 space-y-3">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-700 h-12 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Se procesează...
                    </>
                  ) : paymentMethod === "CARD" ? (
                    `Plătește ${formatPrice(totalPrice())}`
                  ) : (
                    `Plasează comanda — ${formatPrice(totalPrice())}`
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="size-3.5" />
                  <span>Plată securizată</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
