"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveLines, Totals } from "@/components/order-summary";
import { GoogleIcon } from "@/components/google-icon";
import { useAuth, useCart } from "@/components/providers";
import { deliveryFeeFor, formatPrice, type Menu } from "@/lib/menu";

type Defaults = { name: string; email: string; phone: string; address: string };

export function CheckoutForm({ menu, defaults }: { menu: Menu; defaults: Defaults | null }) {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { items, ready, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = resolveLines(items, menu);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold">Nothing to check out yet</h2>
        <Link href="/#menu" className="btn-primary mt-6">
          Browse the menu
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.get("name"),
          phone: form.get("phone"),
          delivery_address: form.get("address"),
          notes: form.get("notes"),
          items: items.map(({ flavour_id, size_id, quantity }) => ({ flavour_id, size_id, quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      clear();
      router.push(`/orders/${data.id}?placed=1${data.emailSent ? "&emailed=1" : ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-card p-6">
        {!user ? (
          <div className="py-8 text-center">
            <h2 className="font-display text-2xl font-semibold">Sign in to check out</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted">
              We use your Google account to save your order and email your receipt. Your cart comes with you.
            </p>
            <button type="button" onClick={() => signIn("/checkout")} className="btn-primary mt-6 px-6 py-3">
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <h2 className="font-display text-2xl font-semibold">Delivery details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <input name="name" required minLength={2} maxLength={100} defaultValue={defaults?.name} className="input" autoComplete="name" />
              </Field>
              <Field label="Email">
                <input value={defaults?.email ?? user.email ?? ""} readOnly className="input opacity-70" />
              </Field>
            </div>
            <Field label="Phone number">
              <input
                name="phone"
                type="tel"
                required
                pattern="[+0-9 ()\-]{7,20}"
                defaultValue={defaults?.phone}
                placeholder="+234 801 234 5678"
                className="input"
                autoComplete="tel"
              />
            </Field>
            <Field label="Delivery address">
              <textarea
                name="address"
                required
                minLength={5}
                maxLength={300}
                rows={3}
                defaultValue={defaults?.address}
                className="input"
                autoComplete="street-address"
              />
            </Field>
            <Field label="Notes for the rider (optional)">
              <input name="notes" maxLength={500} className="input" placeholder="Gate code, landmark, etc." />
            </Field>
            <div className="rounded-2xl bg-surface p-4 text-sm">
              <p className="font-bold">Payment: Pay on delivery</p>
              <p className="text-muted">Pay by cash or transfer when your popcorn arrives.</p>
            </div>
            {error && (
              <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-danger">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? "Placing order..." : `Place order · ${formatPrice(subtotal + deliveryFeeFor(subtotal))}`}
            </button>
          </form>
        )}
      </section>

      <aside className="h-fit rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 font-display text-xl font-semibold">Your order</h2>
        <ul className="mb-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={`${l.flavour_id}-${l.size_id}`} className="flex justify-between gap-2">
              <span>
                {l.quantity} &times; {l.flavour.name} <span className="text-muted">({l.size.name})</span>
              </span>
              <span className="font-semibold">{formatPrice(l.total)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line pt-4">
          <Totals subtotal={subtotal} />
        </div>
        <Link href="/cart" className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">
          Edit cart
        </Link>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
