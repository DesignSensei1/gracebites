"use client";

import type { User } from "@supabase/supabase-js";
import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const AuthContext = createContext<{ user: User | null; signIn: (next?: string) => Promise<void> }>({
  user: null,
  signIn: async () => {},
});
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (next = "/") => {
    if (!isSupabaseConfigured) {
      alert("Supabase isn't configured yet. See the README to add your keys.");
      return;
    }
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }, []);

  return <AuthContext.Provider value={{ user, signIn }}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Cart: kept in localStorage for guests, saved to Supabase once signed in
// ---------------------------------------------------------------------------
export type CartLine = { flavour_id: string; size_id: string; quantity: number };

type CartContextValue = {
  items: CartLine[];
  count: number;
  ready: boolean;
  add: (flavour_id: string, size_id: string, quantity: number) => void;
  setQuantity: (flavour_id: string, size_id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <Providers>");
  return ctx;
}

const STORAGE_KEY = "gracebites-cart";
const MAX_QTY = 99;
const same = (a: CartLine, f: string, s: string) => a.flavour_id === f && a.size_id === s;

function readLocal(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.flavour_id && l.size_id && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    setItems(readLocal());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  // On sign-in, merge the guest cart into the saved cart.
  useEffect(() => {
    if (!ready || !user || syncedUser.current === user.id) return;
    syncedUser.current = user.id;
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.from("cart_items").select("flavour_id,size_id,quantity");
      if (error) return console.error("Could not load saved cart", error);
      const merged: CartLine[] = [...(data ?? [])];
      for (const line of readLocal()) {
        const existing = merged.find((m) => same(m, line.flavour_id, line.size_id));
        if (existing) existing.quantity = Math.min(MAX_QTY, existing.quantity + line.quantity);
        else merged.push({ ...line });
      }
      setItems(merged);
      if (merged.length) {
        await supabase
          .from("cart_items")
          .upsert(merged.map((m) => ({ ...m, user_id: user.id, updated_at: new Date().toISOString() })), {
            onConflict: "user_id,flavour_id,size_id",
          });
      }
    })();
  }, [ready, user]);

  useEffect(() => {
    if (!user) syncedUser.current = null;
  }, [user]);

  const persist = useCallback(
    (flavour_id: string, size_id: string, quantity: number) => {
      if (!user) return;
      const supabase = createClient();
      const op =
        quantity > 0
          ? supabase
              .from("cart_items")
              .upsert(
                { user_id: user.id, flavour_id, size_id, quantity, updated_at: new Date().toISOString() },
                { onConflict: "user_id,flavour_id,size_id" },
              )
          : supabase.from("cart_items").delete().match({ user_id: user.id, flavour_id, size_id });
      op.then(({ error }) => error && console.error("Could not save cart", error));
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
    () => ({ items, ready, count: items.reduce((n, l) => n + l.quantity, 0), add, setQuantity, clear }),
    [items, ready, add, setQuantity, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function Providers({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider initialUser={initialUser}>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
