import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-5xl font-bold text-primary">404</h1>
      <p className="mt-3 text-muted">This kernel never popped. The page you&apos;re looking for isn&apos;t here.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to the shop
      </Link>
    </div>
  );
}
