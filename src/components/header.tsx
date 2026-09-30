"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth, useCart } from "./providers";
import { Logo } from "./popcorn";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { user, signIn } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-display text-2xl font-semibold tracking-tight">
            Grace<span className="text-primary">Bites</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/#menu" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-surface sm:block">
            Menu
          </Link>
          {user && (
            <Link href="/orders" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-surface sm:block">
              My orders
            </Link>
          )}
          <ThemeToggle />
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-surface"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-fg">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-line bg-surface font-bold"
                aria-label="Account menu"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (name ?? "?").charAt(0).toUpperCase()
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-lg" onClick={() => setMenuOpen(false)}>
                  <p className="truncate px-3 py-2 text-sm text-muted">{name}</p>
                  <Link href="/orders" className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface">
                    My orders
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface">Sign out</button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => signIn(window.location.pathname)} className="btn-primary px-4">
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
