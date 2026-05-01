"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  ShoppingCart,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Tablou de bord",
    icon: LayoutDashboard,
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/products",
    label: "Produse",
    icon: Package,
    match: (p) => p.startsWith("/admin/products"),
  },
  {
    href: "/admin/presets",
    label: "Preset-uri",
    icon: Sparkles,
    match: (p) => p.startsWith("/admin/presets"),
  },
  {
    href: "/admin/orders",
    label: "Comenzi",
    icon: ShoppingCart,
    match: (p) => p.startsWith("/admin/orders"),
  },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const current = NAV_ITEMS.find((item) => item.match(pathname));

  return (
    <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
        aria-label="Meniu navigare"
      >
        <Menu size={20} className="text-slate-700" />
      </button>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-0.5">
          Administrare
        </p>
        <p className="text-sm font-semibold text-slate-900 leading-none">
          {current?.label ?? "Admin"}
        </p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-6 py-5 border-b border-slate-200">
            <SheetTitle className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                Administrare
              </p>
              <span className="text-base font-semibold text-slate-900">
                The White Laser
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors",
                    active
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-slate-200">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={14} />
              Înapoi la site
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
