import { StyleSheet, Text, View } from "react-native";
import { STATUS_LABELS } from "@/lib/menu";
import { radius, useColors } from "@/lib/theme";

export function StatusBadge({ status }: { status: string }) {
  const c = useColors();
  const color = status === "cancelled" ? c.danger : c.primary;
  return (
    <View style={[styles.badge, { backgroundColor: c.surfaceStrong }]}>
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: "800" },
});
