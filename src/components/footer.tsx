export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row">
        <p>
          <span className="font-display font-semibold text-ink">GraceBites</span> &middot; Popped fresh, every order.
        </p>
        <p>&copy; {new Date().getFullYear()} GraceBites. All rights reserved.</p>
      </div>
    </footer>
  );
}
