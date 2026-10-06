import { View } from "react-native";
import { Row } from "@/components/ui";
import { deliveryFeeFor, formatPrice, FREE_DELIVERY_OVER, unitPrice, type Menu } from "@/lib/menu";
import type { CartLine } from "@/providers/cart";

/** Cart lines joined with the menu, plus subtotal / delivery / total — same maths as the website. */
export function priceCart(items: CartLine[], menu: Menu) {
  const lines = items
    .map((l) => {
      const flavour = menu.flavours.find((f) => f.id === l.flavour_id);
      const size = menu.sizes.find((s) => s.id === l.size_id);
      if (!flavour || !size) return null;
      const price = unitPrice(flavour, size);
      return { ...l, flavour, size, price, total: price * l.quantity };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const delivery = deliveryFeeFor(subtotal);
  return { lines, subtotal, delivery, total: subtotal + delivery };
}

export function OrderTotals({ subtotal, delivery, total }: { subtotal: number; delivery: number; total: number }) {
  return (
    <View>
      <Row label="Subtotal" value={formatPrice(subtotal)} />
      <Row label="Delivery" value={delivery === 0 ? "Free" : formatPrice(delivery)} />
      {delivery > 0 ? <Row label={`Free delivery over ${formatPrice(FREE_DELIVERY_OVER)}`} value="" /> : null}
      <Row label="Total" value={formatPrice(total)} bold />
    </View>
  );
}
