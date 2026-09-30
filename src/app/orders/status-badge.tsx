const LABELS: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  preparing: "Popping",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const cancelled = status === "cancelled";
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
        cancelled ? "bg-danger/10 text-danger" : "bg-primary/15 text-primary"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
