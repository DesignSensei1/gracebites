import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { PopcornBucket } from "@/components/Popcorn";
import { Button, Card, Chip, QtyStepper } from "@/components/ui";
import { formatPrice, unitPrice, type Flavour, type Size } from "@/lib/menu";
import { radius, useColors } from "@/lib/theme";
import { useCart } from "@/providers/cart";
import { useMenu } from "@/providers/menu";

export default function MenuScreen() {
  const c = useColors();
  const { menu, reload } = useMenu();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
    >
      <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.heroTitle, { color: c.text }]}>
            Every bite, <Text style={{ color: c.primary }}>a little grace.</Text>
          </Text>
          <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }}>
            Four handcrafted flavours, three sizes. Free delivery over {formatPrice(1500000)}.
          </Text>
        </View>
        <PopcornBucket flavour="caramel" size={84} />
      </View>

      <Text style={[styles.section, { color: c.text }]}>Our flavours</Text>
      {menu.flavours.map((f) => (
        <ProductCard key={f.id} flavour={f} sizes={menu.sizes} />
      ))}
    </ScrollView>
  );
}

function ProductCard({ flavour, sizes }: { flavour: Flavour; sizes: Size[] }) {
  const c = useColors();
  const { add } = useCart();
  const [sizeId, setSizeId] = useState(sizes.find((s) => s.id === "medium")?.id ?? sizes[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  if (!size) return null;

  const onAdd = () => {
    add(flavour.id, size.id, qty);
    setQty(1);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.art, { backgroundColor: c.surface }]}>
          <PopcornBucket flavour={flavour.id} size={72} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: c.text }]}>{flavour.name}</Text>
            <Text style={[styles.price, { color: c.primary }]}>{formatPrice(unitPrice(flavour, size))}</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 14, lineHeight: 19 }}>{flavour.description}</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: c.muted }]}>SIZE</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {sizes.map((s) => (
          <Chip key={s.id} label={s.name} selected={s.id === size.id} onPress={() => setSizeId(s.id)} />
        ))}
      </View>

      <View style={styles.actions}>
        <QtyStepper value={qty} onChange={setQty} />
        <Button title={added ? "Added ✓" : "Add to cart"} onPress={onAdd} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderRadius: radius.lg, borderWidth: 1 },
  heroTitle: { fontSize: 26, fontWeight: "800", lineHeight: 31 },
  section: { fontSize: 22, fontWeight: "800", marginTop: 6 },
  card: { gap: 12 },
  cardTop: { flexDirection: "row", gap: 14 },
  art: { width: 92, height: 100, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  name: { fontSize: 20, fontWeight: "800" },
  price: { fontSize: 17, fontWeight: "800" },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  chips: { flexDirection: "row", gap: 8 },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
});
