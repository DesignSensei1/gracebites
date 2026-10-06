import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";
import { AuthProvider } from "@/providers/auth";
import { CartProvider } from "@/providers/cart";
import { MenuProvider } from "@/providers/menu";

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = useColors();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.bg, text: c.text, border: c.border },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <AuthProvider>
          <MenuProvider>
            <CartProvider>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerTintColor: c.primary, headerTitleStyle: { color: c.text, fontWeight: "800" } }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
                <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              </Stack>
            </CartProvider>
          </MenuProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
