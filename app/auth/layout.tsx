import { GiLaserburn } from "react-icons/gi";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 text-slate-800 hover:text-slate-600 transition-colors"
      >
        <GiLaserburn className="size-5" />
        <span className="font-bold tracking-wide text-lg">The White Laser</span>
      </Link>
      {children}
    </div>
  );
}
