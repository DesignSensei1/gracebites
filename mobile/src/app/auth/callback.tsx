import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/lib/theme";
import { completeSignIn } from "@/providers/auth";

/**
 * Google sign-in returns here via gracebites://auth/callback?code=...
 * (on Android the deep link can open this screen as well as resolving the browser session).
 */
export default function AuthCallback() {
  const c = useColors();
  const url = Linking.useLinkingURL();

  useEffect(() => {
    (async () => {
      if (url) await completeSignIn(url).catch(() => {});
      if (router.canGoBack()) router.back();
      else router.replace("/");
    })();
  }, [url]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}
