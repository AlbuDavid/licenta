"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function CartButton() {
  const { openCart, totalItems } = useCartStore();
  const count = totalItems();

  return (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center rounded-md p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      aria-label="Deschide coșul"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
