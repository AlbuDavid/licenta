"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  MissingToken: "Link-ul de verificare este invalid.",
  InvalidToken: "Link-ul de verificare nu a fost găsit sau a fost deja folosit.",
  ExpiredToken: "Link-ul de verificare a expirat. Solicită un link nou.",
  ServerError: "A apărut o eroare pe server. Încearcă din nou.",
  // NextAuth default errors
  OAuthSignin: "Eroare la autentificarea OAuth.",
  OAuthCallback: "Eroare la callback OAuth.",
  OAuthCreateAccount: "Nu s-a putut crea contul OAuth.",
  EmailCreateAccount: "Nu s-a putut crea contul.",
  Callback: "Eroare la callback.",
  OAuthAccountNotLinked: "Acest email este asociat cu un alt provider.",
  SessionRequired: "Trebuie să fii conectat pentru a accesa această pagină.",
  Default: "A apărut o eroare la autentificare.",
};

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES["Default"];

  return (
    <Card className="w-full max-w-sm shadow-sm border-slate-200">
      <CardContent className="pt-6 pb-8 text-center space-y-4">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-lg font-semibold text-slate-900">Eroare de autentificare</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2 pt-2">
          <Button asChild className="bg-slate-900 hover:bg-slate-700">
            <Link href="/auth/login">Înapoi la conectare</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/register">Creează cont nou</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
