// Mirrors src/lib/menu.ts in the website so prices and fees match exactly.
// The server (/api/checkout) always recalculates prices; these are for display.

export type Flavour = { id: string; name: string; description: string; surcharge: number; sort_order: number };
export type Size = { id: string; name: string; description: string; price: number; sort_order: number };
export type Menu = { flavours: Flavour[]; sizes: Size[] };

// Prices are in kobo (1/100 NGN). Used until the live menu loads.
export const DEFAULT_MENU: Menu = {
  flavours: [
    { id: "salted", name: "Salted", description: "Classic butter-kissed popcorn with a pinch of sea salt.", surcharge: 0, sort_order: 1 },
    { id: "sweet", name: "Sweet", description: "Light, sugar-dusted kernels for the sweet tooth.", surcharge: 0, sort_order: 2 },
    { id: "caramel", name: "Caramel", description: "Slow-cooked golden caramel glaze on every piece.", surcharge: 50000, sort_order: 3 },
    { id: "burnt", name: "Burnt", description: "Deep, smoky, extra-toasted caramel with a bitter edge.", surcharge: 30000, sort_order: 4 },
  ],
  sizes: [
    { id: "mini", name: "Mini", description: "A handful to snack on the go.", price: 150000, sort_order: 1 },
    { id: "medium", name: "Medium", description: "Just right for one movie night.", price: 300000, sort_order: 2 },
    { id: "jumbo", name: "Jumbo", description: "Big enough to share with the squad.", price: 500000, sort_order: 3 },
  ],
};

export const DELIVERY_FEE = 100000; // ₦1,000
export const FREE_DELIVERY_OVER = 1500000; // free delivery on orders of ₦15,000+

export function unitPrice(flavour: Pick<Flavour, "surcharge">, size: Pick<Size, "price">) {
  return size.price + flavour.surcharge;
}

export function deliveryFeeFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
}

/** ₦3,500 — formatted by hand so it looks the same on every device. */
export function formatPrice(kobo: number) {
  const naira = Math.round(kobo / 100);
  return `₦${String(naira).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export const FLAVOUR_TINTS: Record<string, { kernel: string; shade: string }> = {
  salted: { kernel: "#FFF8E7", shade: "#F3E3B5" },
  sweet: { kernel: "#FFE4EC", shade: "#F9B8CB" },
  caramel: { kernel: "#F6C66B", shade: "#D9922E" },
  burnt: { kernel: "#9A5B2E", shade: "#5E3418" },
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  preparing: "Popping",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
