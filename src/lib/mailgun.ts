import "server-only";
import { formatPrice } from "./menu";

type EmailOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  delivery_address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { flavour_name: string; size_name: string; quantity: number; unit_price: number; line_total: number }[];
};

export function isMailgunConfigured() {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function renderHtml(order: EmailOrder, orderUrl: string) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e0f2fe">${escape(i.flavour_name)} &middot; ${escape(i.size_name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e0f2fe;text-align:center">${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e0f2fe;text-align:right">${formatPrice(i.line_total)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;background:#f0f9ff;font-family:Arial,Helvetica,sans-serif;color:#0c4a6e">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#38bdf8;padding:28px 32px;color:#ffffff">
        <div style="font-size:26px;font-weight:bold">🍿 GraceBites</div>
        <div style="font-size:15px;margin-top:6px">Your order is confirmed!</div>
      </td></tr>
      <tr><td style="padding:28px 32px">
        <p style="margin:0 0 16px">Hi ${escape(order.customer_name)},</p>
        <p style="margin:0 0 20px">Thanks for your order. We're popping it fresh now. Here's your receipt for order <strong>#${escape(order.order_number)}</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr style="color:#0369a1;font-size:12px;text-transform:uppercase">
            <th align="left" style="padding-bottom:6px">Item</th><th style="padding-bottom:6px">Qty</th><th align="right" style="padding-bottom:6px">Total</th>
          </tr>
          ${rows}
          <tr><td style="padding-top:12px">Subtotal</td><td></td><td style="padding-top:12px;text-align:right">${formatPrice(order.subtotal)}</td></tr>
          <tr><td>Delivery</td><td></td><td style="text-align:right">${order.delivery_fee ? formatPrice(order.delivery_fee) : "Free"}</td></tr>
          <tr><td style="padding-top:8px;font-weight:bold;font-size:16px">Total</td><td></td><td style="padding-top:8px;text-align:right;font-weight:bold;font-size:16px">${formatPrice(order.total)}</td></tr>
        </table>
        <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:12px;font-size:14px">
          <strong>Delivering to</strong><br>${escape(order.delivery_address)}<br>${escape(order.phone)}
          ${order.notes ? `<br><br><strong>Notes</strong><br>${escape(order.notes)}` : ""}
          <br><br><strong>Payment</strong><br>Pay on delivery
        </div>
        <p style="margin:24px 0 0;text-align:center">
          <a href="${orderUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold">View your order</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px 28px;font-size:12px;color:#7dd3fc;text-align:center">GraceBites &middot; Popped with love</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function renderText(order: EmailOrder, orderUrl: string) {
  const lines = order.items.map((i) => `- ${i.quantity} x ${i.flavour_name} (${i.size_name}): ${formatPrice(i.line_total)}`);
  return [
    `Hi ${order.customer_name},`,
    "",
    `Thanks for your GraceBites order #${order.order_number}.`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery: ${order.delivery_fee ? formatPrice(order.delivery_fee) : "Free"}`,
    `Total: ${formatPrice(order.total)} (pay on delivery)`,
    "",
    `Delivering to: ${order.delivery_address} (${order.phone})`,
    "",
    `View your order: ${orderUrl}`,
  ].join("\n");
}

export async function sendOrderConfirmation(order: EmailOrder, orderUrl: string) {
  const apiKey = process.env.MAILGUN_API_KEY!;
  const domain = process.env.MAILGUN_DOMAIN!;
  // Use https://api.eu.mailgun.net for domains in Mailgun's EU region.
  const baseUrl = process.env.MAILGUN_API_URL || "https://api.mailgun.net";
  const from = process.env.MAILGUN_FROM || `GraceBites <orders@${domain}>`;

  const body = new URLSearchParams({
    from,
    to: `${order.customer_name} <${order.customer_email}>`,
    subject: `Your GraceBites order #${order.order_number} is confirmed 🍿`,
    text: renderText(order, orderUrl),
    html: renderHtml(order, orderUrl),
  });

  const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
    body,
  });
  if (!res.ok) {
    throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
  }
}
