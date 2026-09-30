"use client";

import Link from "next/link";
import { resolveLines, Totals } from "@/components/order-summary";
import { PopcornBucket } from "@/components/popcorn";
import { useCart } from "@/components/providers";
import { FREE_DELIVERY_OVER, formatPrice, type Menu } from "@/lib/menu";

export function CartView({ menu }: { menu: Menu }) {
  const { items, ready, setQuantity } = useCart();
  const lines = resolveLines(items, menu);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <PopcornBucket flavour="salted" className="mx-auto h-24 w-24 opacity-80" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted">Pick a flavour and size to get popping.</p>
        <Link href="/#menu" className="btn-primary mt-6">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={`${l.flavour_id}-${l.size_id}`} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-surface">
              <PopcornBucket flavour={l.flavour_id} className="h-16 w-16" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold">{l.flavour.name}</h3>
              <p className="text-sm text-muted">
                {l.size.name} &middot; {formatPrice(l.price)} each
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full font-bold hover:bg-surface"
                    onClick={() => setQuantity(l.flavour_id, l.size_id, l.quantity - 1)}
                    aria-label={`Remove one ${l.flavour.name} ${l.size.name}`}
                  >
                    &minus;
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{l.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full font-bold hover:bg-surface"
                    onClick={() => setQuantity(l.flavour_id, l.size_id, l.quantity + 1)}
                    aria-label={`Add one ${l.flavour.name} ${l.size.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-muted underline-offset-2 hover:text-danger hover:underline"
                  onClick={() => setQuantity(l.flavour_id, l.size_id, 0)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-display text-lg font-semibold">{formatPrice(l.total)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 font-display text-xl font-semibold">Order summary</h2>
        <Totals subtotal={subtotal} />
        {subtotal < FREE_DELIVERY_OVER && (
          <p className="mt-3 text-xs text-muted">Add {formatPrice(FREE_DELIVERY_OVER - subtotal)} more for free delivery.</p>
        )}
        <Link href="/checkout" className="btn-primary mt-6 w-full py-3 text-base">
          Checkout
        </Link>
        <Link href="/#menu" className="mt-3 block text-center text-sm font-semibold text-primary hover:underline">
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}
