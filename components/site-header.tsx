"use client";
import Link from "next/link";
import { GiLaserburn } from "react-icons/gi";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle, // Acesta e un stil ajutător care face un link să arate ca un buton
} from "@/components/ui/navigation-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MdOutlineLightMode } from "react-icons/md";
import { FaCartShopping } from "react-icons/fa6";

const produse: { title: string; href: string; description: string }[] = [
  {
    title: "Tablouri ardezie",
    href: "/",
    description: "Tablouri personalizate gravate cu laseriul",
  },
  {
    title: "Suport cana",
    href: "/",
    description: "Suport de cana personalizat gravat cu laserul",
  },
];

export function SiteHeader() {
  return (
    <header className="top-0 z-50 w-full bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center p-2 min-w-full justify-between">
        <div className=" flex m-2 items-center">
          <GiLaserburn className="mr-2" />
          <Link href="/" className="flex items-center space-x-2">
            {/* TODO: Aici poți pune un <Image> cu logo-ul */}

            <span className="font-bold sm:inline-block">The White Laser</span>
          </Link>
        </div>

        <div className="flex m-2 justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                  Categorii
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {produse.map((produs) => (
                      <li key={produs.title}>
                        <NavigationMenuLink
                          href={produs.href}
                          className={navigationMenuTriggerStyle()}
                        >
                          <div className="font-medium">{produs.title}</div>
                          <p className="text-sm">{produs.description}</p>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Materiale</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="#">Components</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="#">Documentation</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="#">Blocks</Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>

                <NavigationMenuLink
                  href="/produse"
                  className={navigationMenuTriggerStyle()}
                >
                  Produse
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/oferte"
                  className={navigationMenuTriggerStyle()}
                >
                  Oferte
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/portofoliu"
                  className={navigationMenuTriggerStyle()}
                >
                  Portofoliu
                </NavigationMenuLink>
              
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex m-2 justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/Cos"
                  className={navigationMenuTriggerStyle()}
                >
                  Cos
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/profil"
                  className={navigationMenuTriggerStyle()}
                >
                  Profil
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/comenzi"
                  className={navigationMenuTriggerStyle()}
                >
                  Comenzi
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
