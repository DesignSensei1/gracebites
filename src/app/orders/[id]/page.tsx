import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PopcornBucket } from "@/components/popcorn";
import { getUser } from "@/lib/data";
import { formatPrice } from "@/lib/menu";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "../status-badge";

export const metadata = { title: "Order | GraceBites" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; emailed?: string }>;
}) {
  const [{ id }, { placed, emailed }] = await Promise.all([params, searchParams]);
  const user = await getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {placed && (
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-primary to-sky p-8 text-center text-white">
          <PopcornBucket flavour="caramel" className="mx-auto h-20 w-20" />
          <h1 className="mt-3 font-display text-3xl font-bold">Thank you, your order is in!</h1>
          <p className="mt-2 opacity-90">
            {emailed ? `We've emailed a confirmation to ${order.customer_email}.` : "We're popping it fresh right now."}
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Order #{order.order_number}</h2>
            <p className="text-sm text-muted">
              {new Date(order.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <ul className="mt-6 divide-y divide-line border-y border-line">
          {order.order_items.map(
            (i: { id: string; quantity: number; flavour_name: string; size_name: string; line_total: number }) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span>
                  {i.quantity} &times; {i.flavour_name} <span className="text-muted">({i.size_name})</span>
                </span>
                <span className="font-semibold">{formatPrice(i.line_total)}</span>
              </li>
            ),
          )}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd>{order.delivery_fee ? formatPrice(order.delivery_fee) : "Free"}</dd>
          </div>
          <div className="flex justify-between text-lg">
            <dt className="font-display font-semibold">Total</dt>
            <dd className="font-display font-semibold text-primary">{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-bold">Delivering to</p>
            <p className="text-muted">{order.customer_name}</p>
            <p className="text-muted">{order.delivery_address}</p>
            <p className="text-muted">{order.phone}</p>
          </div>
          <div>
            <p className="font-bold">Payment</p>
            <p className="text-muted">Pay on delivery</p>
            {order.notes && (
              <>
                <p className="mt-2 font-bold">Notes</p>
                <p className="text-muted">{order.notes}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/orders" className="btn-ghost">
          All orders
        </Link>
        <Link href="/#menu" className="btn-primary">
          Order again
        </Link>
      </div>
    </div>
  );
}
