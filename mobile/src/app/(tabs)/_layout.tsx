import { Tabs } from "expo-router/js-tabs";
import { Text } from "react-native";
import { useColors } from "@/lib/theme";
import { useCart } from "@/providers/cart";

const icon = (glyph: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const c = useColors();
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text, fontWeight: "800" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "GraceBites", tabBarLabel: "Menu", tabBarIcon: icon("🍿") }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Your cart",
          tabBarLabel: "Cart",
          tabBarIcon: icon("🛒"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: c.primary, color: c.primaryFg },
        }}
      />
      <Tabs.Screen name="orders" options={{ title: "My orders", tabBarLabel: "Orders", tabBarIcon: icon("🧾") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarLabel: "Account", tabBarIcon: icon("👤") }} />
    </Tabs>
  );
}
