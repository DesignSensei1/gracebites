import Link from "next/link";
import { PopcornBucket } from "@/components/popcorn";
import { ProductCard } from "@/components/product-card";
import { getMenu } from "@/lib/data";
import { FREE_DELIVERY_OVER, formatPrice } from "@/lib/menu";

export default async function Home() {
  const { flavours, sizes } = await getMenu();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-strong to-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="min-w-0">
            <p className="inline-block rounded-full bg-card px-4 py-1 text-sm font-bold text-primary shadow-sm">
              Popped fresh, every order
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Every bite, <span className="text-primary">a little grace.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Four handcrafted flavours in three sizes, from a quick Mini to a Jumbo made for sharing. Order online and we&apos;ll bring
              it to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#menu" className="btn-primary px-7 py-3 text-base">
                Order now
              </Link>
              <Link href="/cart" className="btn-ghost px-7 py-3 text-base">
                View cart
              </Link>
            </div>
          </div>
          <div className="relative mx-auto flex min-w-0 max-w-full items-end justify-center gap-2">
            <div className="absolute inset-x-6 bottom-0 top-10 -z-0 rounded-full bg-sky/40 blur-3xl" />
            <PopcornBucket flavour="sweet" className="relative h-24 w-24 -rotate-6 sm:h-32 sm:w-32 md:h-40 md:w-40" />
            <PopcornBucket flavour="caramel" className="relative h-40 w-40 sm:h-52 sm:w-52 md:h-64 md:w-64" />
            <PopcornBucket flavour="burnt" className="relative h-28 w-28 rotate-6 sm:h-36 sm:w-36 md:h-44 md:w-44" />
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-4xl font-bold">Our flavours</h2>
            <p className="mt-2 text-muted">Pick a flavour, choose your size, and add it to your cart.</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm">
            {sizes.map((s) => (
              <li key={s.id} className="rounded-full border border-line bg-surface px-3 py-1">
                <strong>{s.name}</strong> from {formatPrice(s.price)}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {flavours.map((f) => (
            <ProductCard key={f.id} flavour={f} sizes={sizes} />
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          {[
            { t: "Popped to order", d: "Nothing sits on a shelf. Your popcorn is made after you order." },
            { t: "Sign in with Google", d: "One tap to check out, and your cart follows you across devices." },
            { t: `Free delivery over ${formatPrice(FREE_DELIVERY_OVER)}`, d: "Pay on delivery, with an email receipt the moment you order." },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl bg-card p-6">
              <h3 className="font-display text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
