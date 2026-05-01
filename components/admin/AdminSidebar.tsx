"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-slate-50 border-r border-slate-200 flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-200">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
          Administrare
        </p>
        <h2 className="text-base font-semibold text-slate-900">
          The White Laser
        </h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900",
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
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Înapoi la site
        </Link>
      </div>
    </aside>
  );
}
