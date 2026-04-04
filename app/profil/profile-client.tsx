"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { MapPin, Package, ShieldCheck, User } from "lucide-react";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface RecentOrder {
  id: string;
  status: OrderStatus;
  total: number;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
  createdAt: string;
  items: { quantity: number }[];
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  isCredentialsUser: boolean;
  phone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingCounty: string | null;
  shippingPostal: string | null;
}

interface ProfileData {
  user: UserData;
  recentOrders: RecentOrder[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "În așteptare",
  PROCESSING: "În procesare",
  SHIPPED: "Expediat",
  DELIVERED: "Livrat",
  CANCELLED: "Anulat",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

function AvatarInitials({ name, email }: { name: string | null; email: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.[0].toUpperCase() ?? "?";

  return (
    <div className="flex size-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white shrink-0">
      {initials}
    </div>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function StatusMessage({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === "saved") return <span className="text-sm text-emerald-600">Salvat cu succes!</span>;
  if (status === "error") return <span className="text-sm text-red-600">{error ?? "Eroare la salvare."}</span>;
  return null;
}

export function ProfileClient({ user, recentOrders }: ProfileData) {
  // ── Date personale ──
  const [name, setName] = useState(user.name ?? "");
  const [personalStatus, setPersonalStatus] = useState<SaveStatus>("idle");
  const [personalError, setPersonalError] = useState("");

  // ── Adresă de livrare ──
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.shippingAddress ?? "");
  const [city, setCity] = useState(user.shippingCity ?? "");
  const [county, setCounty] = useState(user.shippingCounty ?? "");
  const [postal, setPostal] = useState(user.shippingPostal ?? "");
  const [addressStatus, setAddressStatus] = useState<SaveStatus>("idle");
  const [addressError, setAddressError] = useState("");

  // ── Securitate ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle");
  const [passwordError, setPasswordError] = useState("");

  const memberSince = new Date(user.createdAt).toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  });

  async function savePersonal() {
    setPersonalError("");
    setPersonalStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setPersonalStatus("saved");
      setTimeout(() => setPersonalStatus("idle"), 2500);
    } catch (err) {
      setPersonalError(err instanceof Error ? err.message : "Eroare");
      setPersonalStatus("error");
      setTimeout(() => setPersonalStatus("idle"), 3000);
    }
  }

  async function saveAddress() {
    setAddressError("");
    setAddressStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, shippingAddress: address, shippingCity: city, shippingCounty: county, shippingPostal: postal }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setAddressStatus("saved");
      setTimeout(() => setAddressStatus("idle"), 2500);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Eroare");
      setAddressStatus("error");
      setTimeout(() => setAddressStatus("idle"), 3000);
    }
  }

  async function changePassword() {
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Parolele nu coincid.");
      return;
    }
    setPasswordStatus("saving");
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setPasswordStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 2500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Eroare la schimbarea parolei.");
      setPasswordStatus("idle");
    }
  }

  const totalItems = (order: RecentOrder) =>
    order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Hero card */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="flex items-center gap-5 pt-6">
          <AvatarInitials name={user.name} email={user.email} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-900 truncate">
                {user.name ?? "Fără nume"}
              </h1>
              {user.role === "ADMIN" && (
                <Badge className="bg-slate-900 text-white text-[10px]">Admin</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">Membru din {memberSince}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-6 w-full justify-start border-b border-slate-200 bg-transparent p-0 rounded-none gap-0">
          {[
            { value: "personal", icon: User, label: "Date personale" },
            { value: "address", icon: MapPin, label: "Adresă de livrare" },
            { value: "security", icon: ShieldCheck, label: "Securitate" },
            { value: "orders", icon: Package, label: "Comenzi recente" },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent px-4 pb-2 text-sm font-medium text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none bg-transparent"
            >
              <Icon className="mr-1.5 size-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Date personale ── */}
        <TabsContent value="personal">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Date personale</CardTitle>
              <CardDescription>Actualizează numele afișat în contul tău.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nume complet</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Numele tău"
                  className="max-w-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresă de email</Label>
                <Input
                  id="email"
                  value={user.email ?? ""}
                  readOnly
                  disabled
                  className="max-w-sm bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-400">Emailul nu poate fi modificat direct.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={savePersonal}
                  disabled={personalStatus === "saving" || name.trim() === (user.name ?? "")}
                  className="bg-slate-900 hover:bg-slate-700"
                >
                  {personalStatus === "saving" ? "Se salvează..." : "Salvează"}
                </Button>
                <StatusMessage status={personalStatus} error={personalError} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Adresă de livrare ── */}
        <TabsContent value="address">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Adresă de livrare</CardTitle>
              <CardDescription>
                Salvată și completată automat la fiecare comandă.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0256 592 900"
                  className="max-w-sm"
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="address">Adresă (stradă, număr, apartament)</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bd. Vasile Pârvan, nr. 4"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">Oraș</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Timișoara"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="county">Județ</Label>
                  <Input
                    id="county"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="Timiș"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal">Cod poștal</Label>
                  <Input
                    id="postal"
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder="300223"
                  />
                </div>
              </div>

              {addressError && (
                <p className="text-sm text-red-600">{addressError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={saveAddress}
                  disabled={addressStatus === "saving"}
                  className="bg-slate-900 hover:bg-slate-700"
                >
                  {addressStatus === "saving" ? "Se salvează..." : "Salvează adresa"}
                </Button>
                <StatusMessage status={addressStatus} error={addressError} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Securitate ── */}
        <TabsContent value="security">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Schimbă parola</CardTitle>
              <CardDescription>
                {user.isCredentialsUser
                  ? "Alege o parolă nouă de cel puțin 8 caractere."
                  : "Contul tău este conectat prin Google — nu ai o parolă locală."}
              </CardDescription>
            </CardHeader>
            {user.isCredentialsUser ? (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Parola curentă</Label>
                  <Input id="current-password" type="password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} className="max-w-sm" autoComplete="current-password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Parola nouă</Label>
                  <Input id="new-password" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} className="max-w-sm" autoComplete="new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirmă parola nouă</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} className="max-w-sm" autoComplete="new-password" />
                </div>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={changePassword}
                    disabled={passwordStatus === "saving" || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-slate-900 hover:bg-slate-700"
                  >
                    {passwordStatus === "saving" ? "Se salvează..." : "Schimbă parola"}
                  </Button>
                  <StatusMessage status={passwordStatus} />
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <ShieldCheck className="size-4 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    Conectat prin <strong>Google</strong>. Gestionează parola din contul Google.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* ── Comenzi recente ── */}
        <TabsContent value="orders">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Comenzi recente</CardTitle>
                <CardDescription>Ultimele tale 5 comenzi.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/comenzi">Toate comenzile</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <Package className="mx-auto mb-3 size-8 text-slate-300" />
                  <p className="text-sm text-slate-500">Nu ai plasat nicio comandă încă.</p>
                  <Button asChild className="mt-4 bg-slate-900 hover:bg-slate-700" size="sm">
                    <Link href="/produse">Descoperă produsele</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                            day: "numeric", month: "short", year: "numeric",
                          })}{" "}
                          · {totalItems(order)} {totalItems(order) === 1 ? "produs" : "produse"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
