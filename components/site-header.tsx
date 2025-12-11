"use client"
import Link from "next/link";
import { GiLaserburn } from "react-icons/gi";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle, // Acesta e un stil ajutător care face un link să arate ca un buton
} from "@/components/ui/navigation-menu";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MdOutlineLightMode } from "react-icons/md";
import { FaCartShopping } from "react-icons/fa6";

export function SiteHeader(){
  return(
  <header className="top-0 z-50 w-full bg-background/95 backdrop-blur">
    <div className="container flex h-14 items-center p-2 min-w-full justify-between">
      <div className=" flex m-2 items-center">
          <GiLaserburn className="mr-2" />
          <Link href="/" className="flex items-center space-x-2">
            {/* TODO: Aici poți pune un <Image> cu logo-ul */}

            <span className="font-bold sm:inline-block">The White Laser</span>
          </Link>
        </div>

        <div>

        </div>

        <div className="flex m-2 justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/produse" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Produse
                  </NavigationMenuLink>
                </Link>
                <Link href="/oferte" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Oferte
                  </NavigationMenuLink>
                </Link>
                <Link href="/materiale" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Materiale
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Partea Dreaptă: Meniul de Navigare */}
        


    </div>

  </header>
  )
}