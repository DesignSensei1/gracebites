import type { Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Where Google/Supabase sends the user back after signing in.
 * Expo Go: exp://<your-computer>:8081/--/auth/callback
 * Installed app: gracebites://auth/callback
 * Both must be allowed in Supabase > Authentication > URL Configuration.
 */
export const redirectTo = makeRedirectUri({ scheme: "gracebites", path: "auth/callback" });

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// A sign-in code can only be exchanged once; the browser result and the deep link may both deliver it.
const usedCodes = new Set<string>();

export async function completeSignIn(url: string) {
  const parsed = new URL(url);
  const error = parsed.searchParams.get("error_description") ?? parsed.searchParams.get("error");
  if (error) throw new Error(error);
  const code = parsed.searchParams.get("code");
  if (!code || usedCodes.has(code)) return;
  usedCodes.add(code);
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    if (!isSupabaseConfigured) {
      Alert.alert("Not set up yet", "Add your Supabase keys to mobile/.env and restart the app.");
      return;
    }
    setSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error("No sign-in URL returned");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success") await completeSignIn(result.url);
    } catch (err) {
      Alert.alert("Couldn't sign you in", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, signingIn, signIn, signOut }),
    [session, loading, signingIn, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
