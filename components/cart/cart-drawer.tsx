"use client";

import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} RON`;
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } =
    useCartStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-slate-900">
            <ShoppingBag className="size-5" />
            Coșul tău
            {totalItems() > 0 && (
              <span className="ml-auto text-sm font-normal text-slate-500">
                {totalItems()} {totalItems() === 1 ? "produs" : "produse"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingBag className="size-12 text-slate-200" />
              <p className="text-slate-500 text-sm">Coșul tău este gol.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCart}
                className="mt-2"
              >
                Continuă cumpărăturile
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  {/* Image */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">
                        {item.category}
                      </p>
                      <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 border border-slate-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                          aria-label="Scade cantitatea"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                          aria-label="Crește cantitatea"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Șterge produsul"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with total and checkout */}
        {items.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t bg-slate-50/80 flex-col gap-3">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Transport</span>
              <span className="text-green-600 font-medium">Gratuit</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
            <Button className="w-full bg-slate-900 hover:bg-slate-700 mt-1">
              Finalizează comanda
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-slate-500" onClick={closeCart}>
              Continuă cumpărăturile
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
