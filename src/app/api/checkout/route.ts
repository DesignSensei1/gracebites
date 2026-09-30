import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getMenu } from "@/lib/data";
import { isMailgunConfigured, sendOrderConfirmation } from "@/lib/mailgun";
import { deliveryFeeFor, unitPrice } from "@/lib/menu";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type CheckoutBody = {
  items?: { flavour_id?: string; size_id?: string; quantity?: number }[];
  customer_name?: string;
  phone?: string;
  delivery_address?: string;
  notes?: string;
};

function orderNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `GB-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!isSupabaseConfigured) return bad("The shop database isn't configured yet.", 503);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return bad("Please sign in with Google to place an order.", 401);

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request.");
  }

  const name = body.customer_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const address = body.delivery_address?.trim() ?? "";
  const notes = body.notes?.trim() || null;
  if (name.length < 2 || name.length > 100) return bad("Please enter your full name.");
  if (!/^[+0-9 ()-]{7,20}$/.test(phone)) return bad("Please enter a valid phone number.");
  if (address.length < 5 || address.length > 300) return bad("Please enter a delivery address.");
  if (notes && notes.length > 500) return bad("Notes are too long.");
  if (!Array.isArray(body.items) || body.items.length === 0) return bad("Your cart is empty.");
  if (body.items.length > 12) return bad("Too many items in one order.");

  // Prices always come from the database, never from the browser.
  const menu = await getMenu();
  const items = [];
  for (const raw of body.items) {
    const flavour = menu.flavours.find((f) => f.id === raw.flavour_id);
    const size = menu.sizes.find((s) => s.id === raw.size_id);
    const quantity = Number(raw.quantity);
    if (!flavour || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return bad("One of the items in your cart is no longer available.");
    }
    const price = unitPrice(flavour, size);
    items.push({
      flavour_id: flavour.id,
      size_id: size.id,
      flavour_name: flavour.name,
      size_name: size.name,
      unit_price: price,
      quantity,
      line_total: price * quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
  const delivery_fee = deliveryFeeFor(subtotal);
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber(),
      user_id: user.id,
      customer_name: name,
      customer_email: user.email,
      phone,
      delivery_address: address,
      notes,
      subtotal,
      delivery_fee,
      total: subtotal + delivery_fee,
    })
    .select()
    .single();
  if (orderError || !order) {
    console.error("Order insert failed", orderError);
    return bad("We couldn't place your order. Please try again.", 500);
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) {
    console.error("Order items insert failed", itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return bad("We couldn't place your order. Please try again.", 500);
  }

  // Housekeeping: empty the saved cart and remember delivery details for next time.
  await Promise.all([
    admin.from("cart_items").delete().eq("user_id", user.id),
    admin.from("profiles").update({ phone, address, full_name: name, updated_at: new Date().toISOString() }).eq("id", user.id),
  ]);

  let emailSent = false;
  if (isMailgunConfigured()) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    try {
      await sendOrderConfirmation({ ...order, items }, `${origin}/orders/${order.id}`);
      await admin.from("orders").update({ email_sent_at: new Date().toISOString() }).eq("id", order.id);
      emailSent = true;
    } catch (err) {
      // The order is placed either way; the email failure is logged for follow-up.
      console.error("Confirmation email failed", err);
    }
  } else {
    console.warn("Mailgun is not configured; skipping confirmation email.");
  }

  return NextResponse.json({ id: order.id, order_number: order.order_number, emailSent });
}
