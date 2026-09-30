import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { getUser } from "@/lib/data";
import "./globals.css";

const heading = Fredoka({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GraceBites | Fresh popcorn, popped with love",
  description: "Salted, Sweet, Caramel and Burnt popcorn in Mini, Medium and Jumbo sizes, delivered fresh.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heading.variable} ${body.variable} font-sans antialiased`}>
        <Providers initialUser={user}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
