"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-slate-100" />;
  }

  if (!session) {
    return (
      <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-700">
        <Link href="/auth/login">Conectare</Link>
      </Button>
    );
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user.email?.[0].toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white hover:bg-slate-700 transition-colors focus:outline-none">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
          <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profil">Profilul meu</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/comenzi">Comenzile mele</Link>
        </DropdownMenuItem>
        {session.user.role === "ADMIN" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">Panou admin</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Deconectare
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
