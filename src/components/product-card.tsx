"use client";

import { useState } from "react";
import { formatPrice, unitPrice, type Flavour, type Size } from "@/lib/menu";
import { PopcornBucket } from "./popcorn";
import { useCart } from "./providers";

export function ProductCard({ flavour, sizes }: { flavour: Flavour; sizes: Size[] }) {
  const { add } = useCart();
  const [sizeId, setSizeId] = useState(sizes.find((s) => s.id === "medium")?.id ?? sizes[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  const price = unitPrice(flavour, size);

  function handleAdd() {
    add(flavour.id, size.id, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="grid place-items-center rounded-2xl bg-surface py-5">
        <PopcornBucket flavour={flavour.id} className="h-32 w-32" />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl font-semibold">{flavour.name}</h3>
        <span className="font-display text-xl font-semibold text-primary">{formatPrice(price)}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{flavour.description}</p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Size</legend>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-surface p-1">
          {sizes.map((s) => (
            <label
              key={s.id}
              className={`cursor-pointer rounded-full py-1.5 text-center text-sm font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                s.id === size.id ? "bg-primary text-primary-fg" : "text-ink hover:bg-surface-strong"
              }`}
            >
              <input
                type="radio"
                name={`size-${flavour.id}`}
                value={s.id}
                checked={s.id === size.id}
                onChange={() => setSizeId(s.id)}
                className="sr-only"
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <div className="flex items-center rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-10 w-9 rounded-full text-lg font-bold hover:bg-surface"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span className="w-6 text-center font-bold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="h-10 w-9 rounded-full text-lg font-bold hover:bg-surface"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button type="button" onClick={handleAdd} className="btn-primary flex-1 whitespace-nowrap px-3">
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
