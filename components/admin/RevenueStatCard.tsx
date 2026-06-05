"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type Period = "week" | "month" | "year" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Săpt." },
  { key: "month", label: "Lună" },
  { key: "year", label: "An" },
  { key: "all", label: "Total" },
];

interface RevenueStatCardProps {
  initialRevenue: number;
}

export function RevenueStatCard({ initialRevenue }: RevenueStatCardProps) {
  const [period, setPeriod] = useState<Period>("all");
  const [revenue, setRevenue] = useState(initialRevenue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (period === "all") {
      setRevenue(initialRevenue);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.json())
      .then((data: { revenue?: number }) => setRevenue(data.revenue ?? 0))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, initialRevenue]);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        {/* Icon */}
        <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
          <TrendingUp size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label row + period chips */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 shrink-0">
              Venituri totale
            </p>
            <div className="flex gap-0.5 shrink-0">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    period === key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue value */}
          <p
            className={`text-lg font-bold text-slate-900 leading-snug transition-opacity duration-150 ${
              loading ? "opacity-40" : "opacity-100"
            }`}
          >
            {formatPrice(revenue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
