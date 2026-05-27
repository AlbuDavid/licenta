"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function ClearCartOnMount() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}
