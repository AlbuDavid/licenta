"use client";
import Link from "next/link";
import { GiLaserburn } from "react-icons/gi";
import { AuthNav } from "@/components/auth/auth-nav";
import { CartButton } from "@/components/cart/cart-button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface ProductLink {
  title: string;
  href: string;
}

interface MaterialGroup {
  material: string;
  items: ProductLink[];
}

const materialGroups: MaterialGroup[] = [
  {
    material: "Ardezie",
    items: [
      { title: "Tablouri personalizate", href: "/produse?category=Ardezie" },
      { title: "Suporturi cană", href: "/produse?category=Ardezie" },
    ],
  },
  {
    material: "Lemn",
    items: [
      { title: "Breloc gravat", href: "/produse?category=Lemn" },
      { title: "Copertă laptop", href: "/produse?category=Lemn" },
    ],
  },
  {
    material: "Metal",
    items: [
      { title: "Pix metalic gravat", href: "/produse?category=Metal" },
    ],
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-background/95 backdrop-blur-sm dark:border-slate-800">
      <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-3 items-center px-6">

        {/* Logo — pinned left */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-slate-900 transition-opacity hover:opacity-75 dark:text-slate-100"
        >
          <GiLaserburn className="size-5" />
          <span>The White Laser</span>
        </Link>

        {/* Navigation — truly centered */}
        <div className="flex justify-center">
          <NavigationMenu>
            <NavigationMenuList>

              {/* Produse — mega menu grouped by material */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Produse
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[480px] grid-cols-3 gap-6 p-6">
                    {materialGroups.map((group) => (
                      <div key={group.material}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          {group.material}
                        </p>
                        <ul className="space-y-1">
                          {group.items.map((item) => (
                            <li key={item.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={item.href}
                                  className="block rounded px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  {item.title}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/produse"
                          className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-400"
                        >
                          Vezi toate produsele →
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/portofoliu"
                  className={navigationMenuTriggerStyle()}
                >
                  Portofoliu
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/editor"
                  className={navigationMenuTriggerStyle()}
                >
                  Editor
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Utilities — pinned right */}
        <div className="flex items-center justify-end gap-1">
          <CartButton />
          <AuthNav />
        </div>

      </div>
    </header>
  );
}
