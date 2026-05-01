import { LayoutDashboard, Package, Sparkles, ShoppingCart, Users } from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
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
  {
    href: "/admin/users",
    label: "Utilizatori",
    icon: Users,
    match: (p) => p.startsWith("/admin/users"),
  },
];
