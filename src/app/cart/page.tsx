import { getMenu } from "@/lib/data";
import { CartView } from "./cart-view";

export const metadata = { title: "Your cart | GraceBites" };

export default async function CartPage() {
  const menu = await getMenu();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold">Your cart</h1>
      <CartView menu={menu} />
    </div>
  );
}
