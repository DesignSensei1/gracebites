# GraceBites mobile app 🍿

Android and iOS app for GraceBites, built with **Expo (React Native) + Expo Router**.
It uses the same backend as the website:

- **Supabase** (same project, tables and row-level security) for Google sign-in, the menu, the cart and orders
- **`/api/checkout`** on the live website to place orders (prices are recalculated on the server, and the Mailgun confirmation email goes out as usual)

A customer can sign in on both the app and the website with the same Google account.
The cart is saved in Supabase and synced live through **Supabase Realtime**, so anything added
on the phone shows up on the website straight away, and the other way round.

## Screens

| Tab / screen | What it does |
|---|---|
| Menu | Flavours and sizes from Supabase, add to cart |
| Cart | Change quantities, remove items, live-synced with the website |
| Checkout | Name, phone, address (prefilled from earlier orders), pay on delivery |
| Orders | Order history from the app and the website, with status |
| Order | Order details and status |
| Account | Google sign-in / sign-out |

## One-time setup

1. **Turn on live cart updates.** In Supabase, run the latest `supabase/schema.sql` in the SQL Editor.
   The new part at the bottom adds `cart_items` to Realtime, and it's safe to re-run the whole file.
2. **Allow the app's sign-in redirect.** In Supabase, go to **Authentication → URL Configuration → Redirect URLs** and add:
   - `gracebites://**` (the installed app)
   - `exp://**` (testing in Expo Go)
3. **Deploy the website update.** Push this repo so Vercel redeploys. `/api/checkout` now accepts the app's sign-in token.

Nothing needs to change in Google Cloud. The app signs in through Supabase, which already uses your Google client.

## Run it on your phone

```bash
cd mobile
npm install
cp .env.example .env    # then fill in the three values
npx expo start
```

`.env` needs:

```
EXPO_PUBLIC_SUPABASE_URL=https://txzzbfjfhkjliwhwgrmp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<same anon key as the website>
EXPO_PUBLIC_API_URL=https://gracebites-naie.vercel.app
```

Install **Expo Go** from the App Store or Play Store and scan the QR code shown in the terminal.
Your phone and Mac need to be on the same Wi‑Fi. If they can't connect, use `npx expo start --tunnel`.

## Building installable apps (later)

Use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # APK/AAB
eas build --platform ios       # needs an Apple Developer account
```

Set the three `EXPO_PUBLIC_*` values as EAS environment variables (or in `eas.json`) for production builds.
The bundle ID / package name is `com.gracebites.app` in `app.json`. Change it before your first store build if you want a different one.

## Checks

```bash
npx tsc --noEmit     # typecheck
npx expo-doctor      # dependency check
```
