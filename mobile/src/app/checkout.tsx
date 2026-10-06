import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { OrderTotals, priceCart } from "@/components/OrderTotals";
import { Button, Card, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/menu";
import { API_URL, supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useAuth } from "@/providers/auth";
import { useCart } from "@/providers/cart";
import { useMenu } from "@/providers/menu";

export default function CheckoutScreen() {
  const c = useColors();
  const { user, session, signIn, signingIn } = useAuth();
  const { items, clear } = useCart();
  const { menu } = useMenu();
  const { lines, subtotal, delivery, total } = priceCart(items, menu);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the profile saved by previous orders (website or app).
  useEffect(() => {
    if (!user) return;
    setName((n) => n || ((user.user_metadata?.full_name as string | undefined) ?? ""));
    supabase
      .from("profiles")
      .select("full_name,phone,address")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName((n) => data.full_name || n);
        setPhone((p) => p || data.phone || "");
        setAddress((a) => a || data.address || "");
      });
  }, [user]);

  if (!user || !session) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="Sign in to check out" body="We use your Google account to save your order and send your receipt.">
          <Button title="Continue with Google" onPress={signIn} loading={signingIn} />
        </EmptyState>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="Your cart is empty">
          <Button title="Browse the menu" onPress={() => router.navigate("/")} />
        </EmptyState>
      </View>
    );
  }

  const placeOrder = async () => {
    setError(null);
    if (!API_URL) return setError("EXPO_PUBLIC_API_URL isn't set in mobile/.env.");
    setSubmitting(true);
    try {
      // Same endpoint as the website; prices are recalculated on the server.
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          items: lines.map(({ flavour_id, size_id, quantity }) => ({ flavour_id, size_id, quantity })),
          customer_name: name,
          phone,
          delivery_address: address,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "We couldn't place your order. Please try again.");
      clear();
      router.dismissAll();
      router.push({ pathname: "/order/[id]", params: { id: data.id, placed: "1", emailed: data.emailSent ? "1" : "0" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <Text style={[styles.heading, { color: c.text }]}>Delivery details</Text>
          <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
          <Field label="Delivery address" value={address} onChangeText={setAddress} multiline autoComplete="street-address" />
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Gate code, landmark, best time…" />
          <Text style={{ color: c.muted, fontSize: 13 }}>
            Payment: pay on delivery. Receipt goes to {user.email}.
          </Text>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={[styles.heading, { color: c.text }]}>Your order</Text>
          {lines.map((l) => (
            <View key={`${l.flavour_id}-${l.size_id}`} style={styles.item}>
              <Text style={{ color: c.text, flex: 1 }}>
                {l.quantity} × {l.flavour.name} {l.size.name}
              </Text>
              <Text style={{ color: c.text, fontWeight: "700" }}>{formatPrice(l.total)}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <OrderTotals subtotal={subtotal} delivery={delivery} total={total} />
        </Card>

        {error ? <Text style={[styles.error, { color: c.danger, borderColor: c.danger }]}>{error}</Text> : null}
        <Button title={`Place order · ${formatPrice(total)}`} onPress={placeOrder} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.text, fontWeight: "700" }}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={[
          styles.input,
          { color: c.text, borderColor: c.border, backgroundColor: c.surface },
          props.multiline && { minHeight: 72, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  item: { flexDirection: "row", gap: 8 },
  divider: { height: 1, marginVertical: 4 },
  error: { borderWidth: 1, borderRadius: radius.sm, padding: 12, fontWeight: "600" },
});
