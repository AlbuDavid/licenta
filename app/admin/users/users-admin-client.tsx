"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ShieldCheck,
  ShieldOff,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  image: string | null;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
}

interface UsersAdminClientProps {
  initialUsers: AdminUser[];
}

type SortKey = "name" | "email" | "createdAt" | "orderCount" | "totalSpent";
type SortDir = "asc" | "desc";
type RoleFilter = "all" | "USER" | "ADMIN";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return <ChevronsUpDown size={12} className="ml-1 inline opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp size={12} className="ml-1 inline text-slate-900" />
  ) : (
    <ChevronDown size={12} className="ml-1 inline text-slate-900" />
  );
}

function UserInitials({ name, email }: { name: string | null; email: string }) {
  const source = name ?? email;
  const parts = source.split(/[\s@]/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] ?? "") + (parts[1][0] ?? "")
      : source.slice(0, 2);
  return (
    <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold uppercase shrink-0 select-none">
      {initials}
    </div>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

const CHIP_BASE =
  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap";
const CHIP_ON = "bg-slate-900 text-white border-slate-900";
const CHIP_OFF = "bg-white text-slate-600 border-slate-200 hover:border-slate-400";

// ── Component ─────────────────────────────────────────────────────────────────

export function UsersAdminClient({ initialUsers }: UsersAdminClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const hasFilters = search !== "" || roleFilter !== "all";

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
  }

  const displayed = useMemo(() => {
    let result = users;

    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name")
          cmp = (a.name ?? a.email).localeCompare(b.name ?? b.email, "ro");
        else if (sortKey === "email") cmp = a.email.localeCompare(b.email, "ro");
        else if (sortKey === "createdAt")
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        else if (sortKey === "orderCount") cmp = a.orderCount - b.orderCount;
        else if (sortKey === "totalSpent") cmp = a.totalSpent - b.totalSpent;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [users, search, roleFilter, sortKey, sortDir]);

  async function toggleRole(user: AdminUser) {
    const newRole: "USER" | "ADMIN" = user.role === "ADMIN" ? "USER" : "ADMIN";
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data: { id?: string; role?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      toast.success(
        newRole === "ADMIN"
          ? `${user.name ?? user.email} promovat la ADMIN`
          : `${user.name ?? user.email} retrogradat la USER`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la modificarea rolului");
    } finally {
      setTogglingId(null);
    }
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
          Administrare
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Utilizatori</h1>
        <p className="text-sm text-slate-600 mt-1">
          {users.length} conturi înregistrate
        </p>
      </div>

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`${CHIP_BASE} ${roleFilter === "all" ? CHIP_ON : CHIP_OFF}`}
          onClick={() => setRoleFilter("all")}
        >
          Toți ({users.length})
        </button>
        <button
          className={`${CHIP_BASE} ${roleFilter === "USER" ? CHIP_ON : CHIP_OFF}`}
          onClick={() => setRoleFilter("USER")}
        >
          Clienți ({userCount})
        </button>
        <button
          className={`${CHIP_BASE} ${roleFilter === "ADMIN" ? CHIP_ON : CHIP_OFF}`}
          onClick={() => setRoleFilter("ADMIN")}
        >
          Admini ({adminCount})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <Input
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {hasFilters && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-900 h-9 px-2"
            >
              <X size={14} className="mr-1" /> Resetează
            </Button>
            <span className="text-xs text-slate-400">
              {displayed.length} rezultate
            </span>
          </>
        )}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-sm">Niciun utilizator înregistrat.</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Search className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm">Niciun utilizator corespunde filtrelor.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-8"></th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("name")}
                >
                  Utilizator
                  <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">
                  Rol
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("createdAt")}
                >
                  Înregistrat
                  <SortIcon col="createdAt" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-center px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("orderCount")}
                >
                  Comenzi
                  <SortIcon col="orderCount" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("totalSpent")}
                >
                  Total cheltuit
                  <SortIcon col="totalSpent" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <td className="px-4 py-3">
                    <UserInitials name={user.name} email={user.email} />
                  </td>

                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {user.name ?? <span className="text-slate-400 italic">Fără nume</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                      {user.email}
                    </p>
                  </td>

                  {/* Role badge */}
                  <td className="px-4 py-3 text-center">
                    {user.role === "ADMIN" ? (
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200" variant="outline">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600">
                        Client
                      </Badge>
                    )}
                  </td>

                  {/* Registration date */}
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Order count */}
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">
                    {user.orderCount > 0 ? (
                      <Link
                        href={`/admin/orders?client=${encodeURIComponent(user.email)}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        {user.orderCount}
                        <ExternalLink size={11} />
                      </Link>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  {/* Total spent */}
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {user.totalSpent > 0 ? (
                      formatPrice(user.totalSpent)
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`size-8 ${
                            user.role === "ADMIN"
                              ? "text-indigo-600 hover:text-red-600 hover:bg-red-50"
                              : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          }`}
                          disabled={togglingId === user.id}
                          onClick={() => toggleRole(user)}
                        >
                          {user.role === "ADMIN" ? (
                            <ShieldOff size={15} />
                          ) : (
                            <ShieldCheck size={15} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {user.role === "ADMIN"
                          ? "Retrogradează la Client"
                          : "Promovează la Admin"}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
