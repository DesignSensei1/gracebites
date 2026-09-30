import { getMenu, getUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Checkout | GraceBites" };

export default async function CheckoutPage() {
  const [menu, user] = await Promise.all([getMenu(), getUser()]);

  let defaults = null;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("full_name,phone,address").eq("id", user.id).maybeSingle();
    defaults = {
      name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold">Checkout</h1>
      <CheckoutForm menu={menu} defaults={defaults} />
    </div>
  );
}
