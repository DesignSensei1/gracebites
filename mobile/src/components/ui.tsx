import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, useColors } from "@/lib/theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: pressed ? c.primaryPressed : c.primary }
          : { borderWidth: 1.5, borderColor: c.border, backgroundColor: pressed ? c.surfaceStrong : c.card },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? c.primaryFg : c.primary} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? c.primaryFg : c.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function QtyStepper({ value, onChange, min = 1 }: { value: number; onChange: (n: number) => void; min?: number }) {
  const c = useColors();
  const btn = (label: string, next: number, disabled: boolean, a11y: string) => (
    <Pressable
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={() => onChange(next)}
      hitSlop={6}
      style={({ pressed }) => [styles.stepBtn, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
    >
      <Text style={[styles.stepText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.stepper, { borderColor: c.border }]}>
      {btn("−", value - 1, value <= min, "Decrease quantity")}
      <Text style={[styles.stepValue, { color: c.text }]}>{value}</Text>
      {btn("+", value + 1, value >= 99, "Increase quantity")}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? c.primary : c.surface, borderColor: selected ? c.primary : c.border }]}
    >
      <Text style={[styles.chipText, { color: selected ? c.primaryFg : c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {body ? <Text style={[styles.emptyBody, { color: c.muted }]}>{body}</Text> : null}
      {children}
    </View>
  );
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const c = useColors();
  const style = [styles.rowText, { color: bold ? c.text : c.muted }, bold && styles.bold];
  return (
    <View style={styles.row}>
      <Text style={style}>{label}</Text>
      <Text style={style}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 4 },
  stepBtn: { width: 36, height: 40, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 20, fontWeight: "700" },
  stepValue: { minWidth: 24, textAlign: "center", fontSize: 16, fontWeight: "700" },
  chip: { flex: 1, borderWidth: 1, borderRadius: radius.pill, paddingVertical: 8, alignItems: "center" },
  chipText: { fontSize: 14, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  emptyBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowText: { fontSize: 15 },
  bold: { fontWeight: "800", fontSize: 17 },
});
