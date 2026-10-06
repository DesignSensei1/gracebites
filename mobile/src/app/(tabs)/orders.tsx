import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/menu";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useAuth } from "@/providers/auth";

type OrderRow = { id: string; order_number: string; status: string; total: number; created_at: string };

export default function OrdersScreen() {
  const c = useColors();
  const { user, signIn, signingIn } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,status,total,created_at")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, [user]);

  // Refresh each time the tab is opened, so status changes from the shop show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="Your orders" body="Sign in with Google to see orders placed here or on the website.">
          <Button title="Continue with Google" onPress={signIn} loading={signingIn} />
        </EmptyState>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={orders.length ? styles.content : { flex: 1 }}
      data={orders}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.primary} />}
      ListEmptyComponent={
        loading ? null : (
          <EmptyState title="No orders yet" body="Your first bucket is one tap away.">
            <Button title="Browse the menu" onPress={() => router.navigate("/")} />
          </EmptyState>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/order/${item.id}`)}
          style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.surface : c.card, borderColor: c.border }]}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.number, { color: c.text }]}>{item.order_number}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>
              {new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={[styles.total, { color: c.text }]}>{formatPrice(item.total)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1, borderRadius: radius.lg },
  number: { fontSize: 16, fontWeight: "800" },
  total: { fontSize: 16, fontWeight: "800" },
});
