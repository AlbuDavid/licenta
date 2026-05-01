"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, ExternalLink, MapPin, Phone, Mail, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  StatusBadge,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";

interface CustomDesign {
  fileUrl: string;
  fileName: string;
}

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  customDesign: CustomDesign | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCounty: string;
  shippingPostal: string;
  createdAt: Date;
  items: OrderItem[];
}

interface OrdersAdminClientProps {
  initialOrders: Order[];
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Ramburs",
  CARD: "Card",
};

const STATUS_ALL = "ALL";

type SortKey = "date" | "client" | "total";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} className="ml-1 inline opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="ml-1 inline text-slate-900" />
    : <ChevronDown size={12} className="ml-1 inline text-slate-900" />;
}

export function OrdersAdminClient({ initialOrders }: OrdersAdminClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
  const [clientSearch, setClientSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const hasFilters = clientSearch !== "" || dateFrom !== "" || dateTo !== "";

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function clearFilters() {
    setClientSearch("");
    setDateFrom("");
    setDateTo("");
  }

  const displayed = useMemo(() => {
    let result = orders;

    if (statusFilter !== STATUS_ALL) result = result.filter((o) => o.status === statusFilter);

    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      result = result.filter(
        (o) => o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        else if (sortKey === "client") cmp = a.customerName.localeCompare(b.customerName, "ro");
        else if (sortKey === "total") cmp = a.total - b.total;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [orders, statusFilter, clientSearch, dateFrom, dateTo, sortKey, sortDir]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        if (detailOrder?.id === orderId) {
          setDetailOrder((prev) => (prev ? { ...prev, status } : null));
        }
        toast.success(`Status actualizat: ${ORDER_STATUS_LABELS[status]}`);
      } else {
        toast.error("Eroare la actualizarea statusului");
      }
    } catch {
      toast.error("Eroare de rețea");
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCSV() {
    const headers = [
      "ID",
      "Client",
      "Email",
      "Telefon",
      "Status",
      "Metoda Plata",
      "Total (RON)",
      "Produse",
      "Data",
    ];
    const rows = displayed.map((o) => [
      o.id.slice(-8).toUpperCase(),
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      ORDER_STATUS_LABELS[o.status],
      PAYMENT_LABELS[o.paymentMethod],
      o.total.toFixed(2),
      o.items.reduce((s, i) => s + i.quantity, 0),
      new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(o.createdAt)),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comenzi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${displayed.length} comenzi exportate`);
  }

  function formatDate(d: Date) {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));
  }

  const totalItems = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
            Administrare
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Comenzi</h1>
          <p className="text-sm text-slate-600 mt-1">
            {orders.length} comenzi plasate
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={displayed.length === 0}
          className="mt-1"
        >
          <Download size={14} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${statusFilter === STATUS_ALL ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          onClick={() => setStatusFilter(STATUS_ALL)}
        >
          Toate ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
              onClick={() => setStatusFilter(s)}
            >
              {ORDER_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + date filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Caută client sau email..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">De la</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 text-sm w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Până la</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 text-sm w-36"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-900 h-9 px-2">
            <X size={14} className="mr-1" /> Șterge filtre
          </Button>
        )}
        {hasFilters && (
          <span className="text-xs text-slate-400">{displayed.length} rezultate</span>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShoppingCart className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm">Nicio comandă.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("date")}
                >
                  Comandă<SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("client")}
                >
                  Client<SortIcon col="client" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Produse</th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("total")}
                >
                  Total<SortIcon col="total" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Plată</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-44">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Detalii</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium text-slate-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{order.customerName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[160px]">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{totalItems(order)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-slate-600">{PAYMENT_LABELS[order.paymentMethod]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(v) => changeStatus(order.id, v as OrderStatus)}
                      disabled={updatingId === order.id}
                    >
                      <SelectTrigger className="h-8 text-xs w-40">
                        <SelectValue>
                          <StatusBadge status={order.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge status={s} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetailOrder(order)}>
                      <ExternalLink size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail Sheet */}
      <Sheet open={detailOrder !== null} onOpenChange={(open) => { if (!open) setDetailOrder(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <span className="font-mono">#{detailOrder.id.slice(-8).toUpperCase()}</span>
                  <StatusBadge status={detailOrder.status} />
                </SheetTitle>
                <p className="text-xs text-slate-400">{formatDate(detailOrder.createdAt)}</p>
              </SheetHeader>

              {/* Status change */}
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Modifică status</p>
                <Select
                  value={detailOrder.status}
                  onValueChange={(v) => changeStatus(detailOrder.id, v as OrderStatus)}
                  disabled={updatingId === detailOrder.id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <StatusBadge status={detailOrder.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <StatusBadge status={s} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="mb-5" />

              {/* Customer info */}
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Client</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">{detailOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    {detailOrder.customerEmail}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    {detailOrder.customerPhone}
                  </div>
                </div>
              </div>

              <Separator className="mb-5" />

              {/* Shipping address */}
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Adresă livrare</p>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {detailOrder.shippingAddress}, {detailOrder.shippingCity},{" "}
                    {detailOrder.shippingCounty}, {detailOrder.shippingPostal}
                  </span>
                </div>
              </div>

              <Separator className="mb-5" />

              {/* Items */}
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Produse comandate</p>
                <ul className="space-y-3">
                  {detailOrder.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                        {item.customDesign && (
                          <a
                            href={item.customDesign.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
                          >
                            <ExternalLink size={11} />
                            {item.customDesign.fileName}
                          </a>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="mb-4" />

              {/* Total */}
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Metodă de plată</span>
                <Badge variant="outline">{PAYMENT_LABELS[detailOrder.paymentMethod]}</Badge>
              </div>
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span className="text-lg tabular-nums">{formatPrice(detailOrder.total)}</span>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
