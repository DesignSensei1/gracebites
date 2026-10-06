import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth";

/**
 * Same cart model as the website (src/components/providers.tsx):
 * - guests: kept on the device
 * - signed in: saved to the Supabase `cart_items` table
 * - live: Supabase Realtime pushes changes made on the website (or another phone) instantly
 */
export type CartLine = { flavour_id: string; size_id: string; quantity: number };

type CartValue = {
  items: CartLine[];
  count: number;
  ready: boolean;
  add: (flavour_id: string, size_id: string, quantity: number) => void;
  setQuantity: (flavour_id: string, size_id: string, quantity: number) => void;
  clear: () => void;
  reload: () => Promise<void>;
};

const CartContext = createContext<CartValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

const STORAGE_KEY = "gracebites-cart";
const MAX_QTY = 99;
const same = (a: CartLine, f: string, s: string) => a.flavour_id === f && a.size_id === s;

async function readLocal(): Promise<CartLine[]> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.flavour_id && l.size_id && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    readLocal().then((lines) => {
      setItems(lines);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("cart_items").select("flavour_id,size_id,quantity");
    if (!error && data) setItems(data);
  }, [user]);

  // On sign-in, merge whatever was added as a guest into the saved cart.
  useEffect(() => {
    if (!ready || !user || syncedUser.current === user.id) return;
    syncedUser.current = user.id;
    (async () => {
      const { data, error } = await supabase.from("cart_items").select("flavour_id,size_id,quantity");
      if (error) return console.warn("Could not load saved cart", error.message);
      const merged: CartLine[] = [...(data ?? [])];
      for (const line of await readLocal()) {
        const existing = merged.find((m) => same(m, line.flavour_id, line.size_id));
        if (existing) existing.quantity = Math.min(MAX_QTY, existing.quantity + line.quantity);
        else merged.push({ ...line });
      }
      setItems(merged);
      if (merged.length) {
        await supabase.from("cart_items").upsert(
          merged.map((m) => ({ ...m, user_id: user.id, updated_at: new Date().toISOString() })),
          { onConflict: "user_id,flavour_id,size_id" },
        );
      }
    })();
  }, [ready, user]);

  // Signing out empties the cart on this phone (it stays saved in the account).
  useEffect(() => {
    if (!user && syncedUser.current) {
      syncedUser.current = null;
      setItems([]);
    }
  }, [user]);

  // Live sync with the website and other devices.
  useEffect(() => {
    if (!ready || !user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 250);
    };
    const mine = { schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` };
    const channel = supabase
      .channel(`cart-${user.id}`)
      .on("postgres_changes", { event: "INSERT", ...mine }, soon)
      .on("postgres_changes", { event: "UPDATE", ...mine }, soon)
      // Delete events can't be filtered by user, so any delete triggers a reload of our own cart.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "cart_items" }, soon)
      .subscribe();
    // Catch up on anything missed while the app was in the background.
    const sub = AppState.addEventListener("change", (state) => state === "active" && soon());
    return () => {
      clearTimeout(timer);
      sub.remove();
      supabase.removeChannel(channel);
    };
  }, [ready, user, reload]);

  const persist = useCallback(
    (flavour_id: string, size_id: string, quantity: number) => {
      if (!user) return;
      const op =
        quantity > 0
          ? supabase
              .from("cart_items")
              .upsert(
                { user_id: user.id, flavour_id, size_id, quantity, updated_at: new Date().toISOString() },
                { onConflict: "user_id,flavour_id,size_id" },
              )
          : supabase.from("cart_items").delete().match({ user_id: user.id, flavour_id, size_id });
      op.then(({ error }) => error && console.warn("Could not save cart", error.message));
    },
    [user],
  );

  const setQuantity = useCallback(
    (flavour_id: string, size_id: string, quantity: number) => {
      const q = Math.max(0, Math.min(MAX_QTY, Math.floor(quantity)));
      setItems((prev) => {
        const rest = prev.filter((l) => !same(l, flavour_id, size_id));
        if (q === 0) return rest;
        const idx = prev.findIndex((l) => same(l, flavour_id, size_id));
        const line = { flavour_id, size_id, quantity: q };
        return idx === -1 ? [...prev, line] : prev.map((l, i) => (i === idx ? line : l));
      });
      persist(flavour_id, size_id, q);
    },
    [persist],
  );

  const add = useCallback(
    (flavour_id: string, size_id: string, quantity: number) => {
      const current = items.find((l) => same(l, flavour_id, size_id))?.quantity ?? 0;
      setQuantity(flavour_id, size_id, current + quantity);
    },
    [items, setQuantity],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, ready, count: items.reduce((n, l) => n + l.quantity, 0), add, setQuantity, clear, reload }),
    [items, ready, add, setQuantity, clear, reload],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
