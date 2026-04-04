"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Paperclip, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface FormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCounty: string;
  shippingPostal: string;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
}

interface ProfileResponse {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingCounty: string | null;
    shippingPostal: string | null;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCounty: "",
    shippingPostal: "",
    paymentMethod: "CASH_ON_DELIVERY",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pre-fill form with saved profile data if user is logged in
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileResponse | null) => {
        if (!data?.user) return;
        const { user } = data;
        setForm((prev) => ({
          ...prev,
          customerName: user.name ?? prev.customerName,
          customerEmail: user.email ?? prev.customerEmail,
          customerPhone: user.phone ?? prev.customerPhone,
          shippingAddress: user.shippingAddress ?? prev.shippingAddress,
          shippingCity: user.shippingCity ?? prev.shippingCity,
          shippingCounty: user.shippingCounty ?? prev.shippingCounty,
          shippingPostal: user.shippingPostal ?? prev.shippingPostal,
        }));
      })
      .catch(() => {/* not logged in or network error — ignore */});
  }, []);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <ShoppingBag className="size-12 text-slate-200" />
        <p className="text-slate-500">Coșul tău este gol.</p>
        <Button asChild variant="outline">
          <Link href="/produse">Continuă cumpărăturile</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...form,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          ...(item.customDesign
            ? {
                customDesign: {
                  fileUrl: item.customDesign.fileUrl,
                  fileName: item.customDesign.fileName,
                },
              }
            : {}),
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "A apărut o eroare. Încearcă din nou.");
        return;
      }

      const { orderId } = await res.json();
      clearCart();
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch {
      setError("A apărut o eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* Left: form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Finalizează comanda</h1>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Date de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nume complet *</Label>
                <Input
                  id="customerName"
                  required
                  value={form.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  placeholder="Ion Popescu"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  required
                  value={form.customerEmail}
                  onChange={(e) => set("customerEmail", e.target.value)}
                  placeholder="ion@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Telefon *</Label>
              <Input
                id="customerPhone"
                type="tel"
                required
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                placeholder="07xx xxx xxx"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Adresă de livrare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shippingAddress">Adresă *</Label>
              <Input
                id="shippingAddress"
                required
                value={form.shippingAddress}
                onChange={(e) => set("shippingAddress", e.target.value)}
                placeholder="Str. Exemplu, nr. 1, ap. 2"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shippingCity">Oraș *</Label>
                <Input
                  id="shippingCity"
                  required
                  value={form.shippingCity}
                  onChange={(e) => set("shippingCity", e.target.value)}
                  placeholder="Cluj-Napoca"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shippingCounty">Județ *</Label>
                <Input
                  id="shippingCounty"
                  required
                  value={form.shippingCounty}
                  onChange={(e) => set("shippingCounty", e.target.value)}
                  placeholder="Cluj"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shippingPostal">Cod poștal *</Label>
                <Input
                  id="shippingPostal"
                  required
                  value={form.shippingPostal}
                  onChange={(e) => set("shippingPostal", e.target.value)}
                  placeholder="400000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Metodă de plată</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(v) => set("paymentMethod", v as FormState["paymentMethod"])}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-4 cursor-pointer has-[[data-state=checked]]:border-slate-900">
                <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer flex-1">
                  <span className="font-medium">Ramburs la livrare</span>
                  <p className="text-sm text-slate-500 font-normal">Plătești când primești coletul</p>
                </Label>
              </div>
              <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-4 cursor-pointer has-[[data-state=checked]]:border-slate-900">
                <RadioGroupItem value="CARD" id="card" />
                <Label htmlFor="card" className="cursor-pointer flex-1">
                  <span className="font-medium">Card bancar</span>
                  <p className="text-sm text-slate-500 font-normal">Procesare securizată online</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-700 h-12 text-base"
        >
          {loading ? "Se procesează..." : "Plasează comanda"}
        </Button>
      </form>

      {/* Right: order summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Sumar comandă</h2>
        <Card>
          <CardContent className="pt-4 space-y-4">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                      {item.name}
                    </p>
                    {item.customDesign && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Paperclip className="size-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500 truncate">
                          {item.customDesign.fileName}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport</span>
                <span className="text-green-600 font-medium">Gratuit</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
