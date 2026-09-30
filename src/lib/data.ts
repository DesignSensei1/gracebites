import "server-only";
import { DEFAULT_MENU, type Menu } from "./menu";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export async function getMenu(): Promise<Menu> {
  if (!isSupabaseConfigured) return DEFAULT_MENU;
  const supabase = await createClient();
  const [flavours, sizes] = await Promise.all([
    supabase.from("flavours").select("id,name,description,surcharge,sort_order").eq("active", true).order("sort_order"),
    supabase.from("sizes").select("id,name,description,price,sort_order").eq("active", true).order("sort_order"),
  ]);
  if (flavours.error || sizes.error || !flavours.data?.length || !sizes.data?.length) {
    console.error("Falling back to default menu", flavours.error ?? sizes.error);
    return DEFAULT_MENU;
  }
  return { flavours: flavours.data, sizes: sizes.data };
}

export async function getUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
