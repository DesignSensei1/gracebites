import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { OrderTotals, priceCart } from "@/components/OrderTotals";
import { PopcornBucket } from "@/components/Popcorn";
import { Button, Card, EmptyState, QtyStepper } from "@/components/ui";
import { formatPrice } from "@/lib/menu";
import { radius, useColors } from "@/lib/theme";
import { useAuth } from "@/providers/auth";
import { useCart } from "@/providers/cart";
import { useMenu } from "@/providers/menu";

export default function CartScreen() {
  const c = useColors();
  const { user, signIn, signingIn } = useAuth();
  const { items, setQuantity, reload } = useCart();
  const { menu } = useMenu();
  const [refreshing, setRefreshing] = useState(false);
  const { lines, subtotal, delivery, total } = priceCart(items, menu);

  if (lines.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="Your cart is empty" body="Pick a flavour from the menu to get popping.">
          <Button title="Browse the menu" onPress={() => router.navigate("/")} />
        </EmptyState>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      refreshControl={
        user ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={c.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
          />
        ) : undefined
      }
    >
      {user ? (
        <Text style={[styles.sync, { color: c.muted }]}>● Synced live with your GraceBites account on the web</Text>
      ) : null}

      {lines.map((l) => (
        <Card key={`${l.flavour_id}-${l.size_id}`} style={styles.line}>
          <View style={[styles.art, { backgroundColor: c.surface }]}>
            <PopcornBucket flavour={l.flavour_id} size={44} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.lineTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lineName, { color: c.text }]}>
                  {l.flavour.name} · {l.size.name}
                </Text>
                <Text style={{ color: c.muted, fontSize: 13 }}>{formatPrice(l.price)} each</Text>
              </View>
              <Text style={[styles.lineTotal, { color: c.text }]}>{formatPrice(l.total)}</Text>
            </View>
            <View style={styles.lineActions}>
              <QtyStepper value={l.quantity} onChange={(q) => setQuantity(l.flavour_id, l.size_id, q)} />
              <Pressable onPress={() => setQuantity(l.flavour_id, l.size_id, 0)} hitSlop={8}>
                <Text style={{ color: c.danger, fontWeight: "700" }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}

      <Card style={{ gap: 12 }}>
        <OrderTotals subtotal={subtotal} delivery={delivery} total={total} />
        {user ? (
          <Button title="Checkout" onPress={() => router.push("/checkout")} />
        ) : (
          <>
            <Text style={{ color: c.muted, textAlign: "center" }}>Sign in with Google to check out.</Text>
            <Button title="Continue with Google" onPress={signIn} loading={signingIn} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  sync: { fontSize: 13, fontWeight: "600" },
  line: { flexDirection: "row", gap: 12, padding: 12 },
  art: { width: 60, height: 64, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  lineTop: { flexDirection: "row", gap: 8 },
  lineName: { fontSize: 16, fontWeight: "800" },
  lineTotal: { fontSize: 16, fontWeight: "800" },
  lineActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
