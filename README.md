# GraceBites 🍿

Online popcorn shop for **GraceBites**: 4 flavours (Salted, Sweet, Caramel, Burnt) in 3 sizes (Mini, Medium, Jumbo), a cart and checkout, Google sign-in, order history, email confirmations, and light/dark mode in a sky blue and white theme.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres + Auth) · Google OAuth · Mailgun · next-themes

## Features

- **Menu** loaded from Supabase (`flavours` and `sizes` tables). Price = size price + flavour surcharge.
- **Cart** that works for guests (saved in the browser) and is saved to Supabase once you sign in, merged with anything added before sign-in, so it follows you across devices.
- **Checkout** (requires Google sign-in) with name, phone, delivery address and notes. Payment is *pay on delivery*. Your details are remembered for next time.
- **Server-side pricing:** `/api/checkout` recalculates every price from the database, so totals can't be tampered with in the browser.
- **Orders** stored in `orders` / `order_items`, with a *My orders* page and an order detail page.
- **Confirmation email** sent through Mailgun (HTML + plain text) right after the order is placed.
- **Light / dark mode** toggle in the header (follows the system setting by default).

### Default prices (edit in Supabase any time)

| Size   | Price  |   | Flavour | Surcharge |
|--------|--------|---|---------|-----------|
| Mini   | ₦1,500 |   | Salted  | +₦0       |
| Medium | ₦3,000 |   | Sweet   | +₦0       |
| Jumbo  | ₦5,000 |   | Caramel | +₦500     |
|        |        |   | Burnt   | +₦300     |

Delivery is ₦1,000, free on orders of ₦15,000 or more (`src/lib/menu.ts`). Prices are stored in kobo (₦1 = 100).

---

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the tables, row-level-security policies, the new-user profile trigger and the menu seed data.
3. In **Project Settings → API**, copy into `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose it)
4. In **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (your production URL once deployed)
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback`

### 3. Google sign-in (Google Cloud Console)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name (GraceBites), support email and developer email. Add scopes `email`, `profile`, `openid`. While in *Testing* mode, add your Google account under *Test users* (or publish the app).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `http://localhost:3000` and `https://YOUR-DOMAIN`
   - **Authorized redirect URIs:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     (copy the exact value from Supabase: **Authentication → Sign In / Providers → Google → Callback URL**)
4. Copy the **Client ID** and **Client secret**.
5. In Supabase: **Authentication → Sign In / Providers → Google**, enable it and paste the Client ID and Client secret. Save.

### 4. Mailgun

1. Sign up at [mailgun.com](https://www.mailgun.com/) and add a sending domain (for example `mg.yourdomain.com`) under **Sending → Domains**, then add the DNS records it shows and wait for it to verify.
   - To try it quickly you can use the free **sandbox domain**, but it only sends to *Authorized Recipients* you add in the dashboard.
2. Create a private API key under **Account → API Keys** (or **Sending → Domain settings → Sending API keys**).
3. Fill in `.env.local`:
   - `MAILGUN_API_KEY` — the private API key
   - `MAILGUN_DOMAIN` — e.g. `mg.yourdomain.com` or `sandboxXXXX.mailgun.org`
   - `MAILGUN_FROM` — e.g. `GraceBites <orders@mg.yourdomain.com>`
   - `MAILGUN_API_URL` — `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU domains)

If Mailgun isn't configured, orders are still saved; the email step is skipped and a warning is logged.

### 5. Run

```bash
npm run dev     # http://localhost:3000
npm run build && npm start   # production
```

Without Supabase keys the storefront still renders using the default menu, but sign-in and checkout are disabled until you add them.

## Deploying (Vercel)

1. Push this folder to GitHub and import it on [vercel.com](https://vercel.com/new).
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to your live URL.
3. Add the live URL to Supabase (Site URL + `/auth/callback` redirect) and to Google (JavaScript origin).

## Mobile app

The `mobile/` folder has an Expo (React Native) app for Android and iOS. It uses the same Supabase project and the same `/api/checkout` endpoint. Customers sign in with the same Google account, and the cart syncs live between the app and the website through Supabase Realtime. See [`mobile/README.md`](mobile/README.md) for setup.

## Project structure

```
supabase/schema.sql          Tables, RLS policies, triggers, menu seed
src/app/page.tsx             Home + menu
src/app/cart/                Cart page
src/app/checkout/            Checkout page and form
src/app/orders/              Order history and order detail
src/app/login/               Google sign-in page
src/app/auth/callback/       OAuth code exchange
src/app/auth/signout/        Sign out
src/app/api/checkout/        Creates the order and sends the Mailgun email
src/components/providers.tsx Theme, auth and cart state (localStorage + Supabase sync)
src/lib/menu.ts              Types, default menu, pricing and currency helpers
src/lib/mailgun.ts           Confirmation email template and sender
src/lib/supabase/            Browser, server, admin clients and session middleware
```

## Managing orders

Orders land in the `orders` table. Update `status` in the Supabase Table Editor to one of `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`; customers see the change on their *My orders* page.
