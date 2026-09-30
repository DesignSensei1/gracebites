"use client";

import { GoogleIcon } from "@/components/google-icon";
import { useAuth } from "@/components/providers";

export function SignInButton({ next }: { next?: string }) {
  const { signIn } = useAuth();
  return (
    <button type="button" onClick={() => signIn(next?.startsWith("/") ? next : "/")} className="btn-primary mt-8 px-6 py-3 text-base">
      <GoogleIcon /> Continue with Google
    </button>
  );
}
