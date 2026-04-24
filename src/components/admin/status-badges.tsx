import { cn } from "@/lib/utils";

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const tone =
    s === "DELIVERED"
      ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
      : s === "CANCELLED"
        ? "bg-red-100 text-red-900 ring-red-200"
        : s === "SHIPPED"
          ? "bg-sky-100 text-sky-900 ring-sky-200"
          : s === "PROCESSING" || s === "CONFIRMED"
            ? "bg-violet-100 text-violet-900 ring-violet-200"
            : "bg-amber-100 text-amber-900 ring-amber-200";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
      {formatStatusLabel(status)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const tone =
    s === "PAID"
      ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
      : s === "FAILED" || s === "REFUNDED"
        ? "bg-red-100 text-red-900 ring-red-200"
        : s === "PARTIALLY_REFUNDED"
          ? "bg-orange-100 text-orange-900 ring-orange-200"
          : "bg-slate-200 text-slate-800 ring-slate-300";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
      {formatStatusLabel(status)}
    </span>
  );
}
