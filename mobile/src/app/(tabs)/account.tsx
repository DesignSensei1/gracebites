import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { PopcornBucket } from "@/components/Popcorn";
import { Button, Card } from "@/components/ui";
import { API_URL, isSupabaseConfigured } from "@/lib/supabase";
import { useColors } from "@/lib/theme";
import { useAuth } from "@/providers/auth";

export default function AccountScreen() {
  const c = useColors();
  const { user, signIn, signOut, signingIn, loading } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.name as string | undefined);
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content}>
      {!isSupabaseConfigured ? (
        <Card style={{ borderColor: c.danger }}>
          <Text style={{ color: c.danger, fontWeight: "700" }}>
            Supabase isn&apos;t configured. Copy mobile/.env.example to mobile/.env, add your keys, and restart Expo.
          </Text>
        </Card>
      ) : null}

      {user ? (
        <Card style={styles.profile}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <PopcornBucket flavour="caramel" size={56} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]}>{name ?? "Signed in"}</Text>
            <Text style={{ color: c.muted }}>{user.email}</Text>
          </View>
        </Card>
      ) : (
        <Card style={{ gap: 12, alignItems: "center" }}>
          <PopcornBucket flavour="caramel" size={80} />
          <Text style={[styles.name, { color: c.text }]}>Welcome to GraceBites</Text>
          <Text style={{ color: c.muted, textAlign: "center" }}>
            Sign in with the same Google account you use on the website. Your cart and orders follow you between both.
          </Text>
          <Button title="Continue with Google" onPress={signIn} loading={signingIn || loading} style={{ alignSelf: "stretch" }} />
        </Card>
      )}

      {API_URL ? (
        <Button title="Open the website" variant="outline" onPress={() => Linking.openURL(API_URL)} />
      ) : null}
      {user ? <Button title="Sign out" variant="outline" onPress={signOut} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  name: { fontSize: 18, fontWeight: "800" },
});
