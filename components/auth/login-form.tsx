"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("A apărut o eroare neașteptată. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-sm border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-slate-900">Conectare</CardTitle>
        <CardDescription className="text-slate-500">
          Introdu datele contului tău
        </CardDescription>
      </CardHeader>

      <CardContent>
        {verified && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Email verificat cu succes! Te poți conecta acum.
          </div>
        )}

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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-700"
            disabled={loading}
          >
            {loading ? "Se conectează..." : "Conectare"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Nu ai cont?{" "}
          <Link href="/auth/register" className="font-medium text-slate-900 hover:underline">
            Înregistrează-te
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
