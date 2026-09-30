"use client";

import { deliveryFeeFor, formatPrice, unitPrice, type Menu } from "@/lib/menu";
import type { CartLine } from "./providers";

export function resolveLines(items: CartLine[], menu: Menu) {
  return items.flatMap((line) => {
    const flavour = menu.flavours.find((f) => f.id === line.flavour_id);
    const size = menu.sizes.find((s) => s.id === line.size_id);
    if (!flavour || !size) return [];
    const price = unitPrice(flavour, size);
    return [{ ...line, flavour, size, price, total: price * line.quantity }];
  });
}

export function Totals({ subtotal }: { subtotal: number }) {
  const delivery = deliveryFeeFor(subtotal);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="font-semibold">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Delivery</dt>
        <dd className="font-semibold">{delivery ? formatPrice(delivery) : "Free"}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-lg">
        <dt className="font-display font-semibold">Total</dt>
        <dd className="font-display font-semibold text-primary">{formatPrice(subtotal + delivery)}</dd>
      </div>
    </dl>
  );
}
