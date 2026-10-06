import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { OrderTotals } from "@/components/OrderTotals";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/menu";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";

type Order = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  delivery_address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items: { id: string; flavour_name: string; size_name: string; quantity: number; line_total: number }[];
};

export default function OrderScreen() {
  const c = useColors();
  const { id, placed, emailed } = useLocalSearchParams<{ id: string; placed?: string; emailed?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
    setOrder(data as Order | null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !order) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="Order not found" body="It may belong to a different account." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.primary} />}
    >
      {placed === "1" ? (
        <Card style={{ backgroundColor: c.surface, gap: 4 }}>
          <Text style={[styles.thanks, { color: c.text }]}>Thank you! Your order is in. 🍿</Text>
          <Text style={{ color: c.muted }}>
            {emailed === "1" ? `A confirmation email is on its way to ${order.customer_email}.` : "We'll be in touch to confirm delivery."}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: 6 }}>
        <View style={styles.headerRow}>
          <Text style={[styles.number, { color: c.text }]}>{order.order_number}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={{ color: c.muted }}>
          {new Date(order.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </Text>
      </Card>

      <Card style={{ gap: 8 }}>
        {order.order_items.map((i) => (
          <View key={i.id} style={styles.item}>
            <Text style={{ color: c.text, flex: 1 }}>
              {i.quantity} × {i.flavour_name} {i.size_name}
            </Text>
            <Text style={{ color: c.text, fontWeight: "700" }}>{formatPrice(i.line_total)}</Text>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <OrderTotals subtotal={order.subtotal} delivery={order.delivery_fee} total={order.total} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Text style={[styles.label, { color: c.muted }]}>DELIVER TO</Text>
        <Text style={{ color: c.text, fontWeight: "700" }}>{order.customer_name}</Text>
        <Text style={{ color: c.text }}>{order.phone}</Text>
        <Text style={{ color: c.text }}>{order.delivery_address}</Text>
        {order.notes ? <Text style={{ color: c.muted, marginTop: 4 }}>Note: {order.notes}</Text> : null}
        <Text style={{ color: c.muted, marginTop: 8 }}>Payment: pay on delivery</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  thanks: { fontSize: 18, fontWeight: "800" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  number: { fontSize: 20, fontWeight: "800" },
  item: { flexDirection: "row", gap: 8 },
  divider: { height: 1, marginVertical: 4 },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 2 },
});
