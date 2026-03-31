"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }

    if (password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({ name, email, password });

      if (!result.success) {
        setError(result.error ?? "A apărut o eroare.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm shadow-sm border-slate-200">
        <CardContent className="pt-6 pb-8 text-center space-y-3">
          <div className="text-3xl">✉️</div>
          <h2 className="text-lg font-semibold text-slate-900">Verifică-ți email-ul</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Am trimis un link de confirmare la <strong>{email}</strong>.
            Accesează link-ul pentru a-ți activa contul.
          </p>
          <Link href="/auth/login" className="inline-block text-sm font-medium text-slate-900 hover:underline mt-2">
            Înapoi la conectare
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-sm border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-slate-900">Cont nou</CardTitle>
        <CardDescription className="text-slate-500">
          Completează datele de mai jos
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-200 hover:bg-slate-50"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continuă cu Google
        </Button>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-slate-400">
            sau
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">Nume</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ion Popescu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">Parolă</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minim 8 caractere"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-slate-700">Confirmă parola</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-700"
            disabled={loading}
          >
            {loading ? "Se creează contul..." : "Creează cont"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Ai deja cont?{" "}
          <Link href="/auth/login" className="font-medium text-slate-900 hover:underline">
            Conectează-te
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
