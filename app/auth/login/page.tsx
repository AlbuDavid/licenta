import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Conectare — The White Laser",
};

export default function LoginPage() {
  return (
    // Suspense required because LoginForm reads searchParams via useSearchParams
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
