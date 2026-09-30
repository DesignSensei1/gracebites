import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";
import { SignInButton } from "./sign-in-button";

export const metadata = { title: "Sign in | GraceBites" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  if (await getUser()) redirect(next?.startsWith("/") ? next : "/");

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-bold">Welcome to GraceBites</h1>
      <p className="mt-3 text-muted">Sign in with Google to check out, save your cart and see your orders.</p>
      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-danger">
          We couldn&apos;t sign you in. Please try again.
        </p>
      )}
      <SignInButton next={next} />
    </div>
  );
}
