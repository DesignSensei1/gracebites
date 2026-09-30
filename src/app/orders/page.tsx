import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";
import { formatPrice } from "@/lib/menu";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "./status-badge";

export const metadata = { title: "My orders | GraceBites" };

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/orders");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total,created_at,order_items(quantity)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold">My orders</h1>
      {!orders?.length ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="text-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/#menu" className="btn-primary mt-6">
            Order some popcorn
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-card p-5 transition-colors hover:bg-surface"
              >
                <div>
                  <p className="font-display text-lg font-semibold">#{o.order_number}</p>
                  <p className="text-sm text-muted">
                    {new Date(o.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })} &middot;{" "}
                    {o.order_items.reduce((n: number, i: { quantity: number }) => n + i.quantity, 0)} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold">{formatPrice(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
