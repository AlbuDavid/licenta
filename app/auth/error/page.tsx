import { Suspense } from "react";
import { AuthErrorContent } from "@/components/auth/auth-error-content";

export const metadata = {
  title: "Eroare — The White Laser",
};

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
