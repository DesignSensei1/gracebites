import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_MENU, type Menu } from "@/lib/menu";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type MenuValue = { menu: Menu; loading: boolean; reload: () => Promise<void> };
const MenuContext = createContext<MenuValue | null>(null);

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used inside <MenuProvider>");
  return ctx;
}

/** Loads flavours and sizes from the same Supabase tables as the website. */
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<Menu>(DEFAULT_MENU);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [flavours, sizes] = await Promise.all([
      supabase.from("flavours").select("id,name,description,surcharge,sort_order").eq("active", true).order("sort_order"),
      supabase.from("sizes").select("id,name,description,price,sort_order").eq("active", true).order("sort_order"),
    ]);
    if (!flavours.error && !sizes.error && flavours.data?.length && sizes.data?.length) {
      setMenu({ flavours: flavours.data, sizes: sizes.data });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ menu, loading, reload }), [menu, loading, reload]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
