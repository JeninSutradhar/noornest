import Link from "next/link";

import { patchOrderAction } from "@/app/admin/resource-actions";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { ShipmentActions } from "@/components/admin/shipment-actions";
import { adminApi } from "@/lib/admin-api";
import { getAdminKeyFromCookie } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;

function statusOptions(allowed: readonly string[], current: string): string[] {
  if (allowed.includes(current)) return [...allowed];
  return [current, ...allowed];
}

type LineImage = { imageUrl: string; isFeatured?: boolean; sortOrder?: number };

type OrderItemRow = {
  id: string;
  productTitle: string;
  productId: string;
  quantity: number;
  totalPrice: string | number;
  product?: {
    id: string;
    slug: string;
    images: LineImage[];
  } | null;
};

function pickLineThumb(images?: LineImage[]) {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const featured = sorted.find((i) => i.isFeatured);
  return (featured ?? sorted[0])?.imageUrl?.trim() || null;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, adminKey] = await Promise.all([
    adminApi<{
    id: string;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    notes?: string | null;
    createdAt: string;
    subtotalAmount: string | number;
    shippingChargeAmount: string | number;
    taxAmount: string | number;
    totalAmount: string | number;
    guestEmail?: string | null;
    user?: { name?: string | null; email?: string | null } | null;
    shipment?: {
      status?: string | null;
      trackingUrl?: string | null;
      awbCode?: string | null;
      courierName?: string | null;
      shiprocketShipmentId?: string | null;
      pickupRequested?: boolean;
    } | null;
    items: OrderItemRow[];
  }>(`/api/admin/orders/${id}`),
    getAdminKeyFromCookie(),
  ]);

  const orderStatusOptions = statusOptions(ORDER_STATUSES, order.orderStatus);
  const paymentStatusOptions = statusOptions(PAYMENT_STATUSES, order.paymentStatus);

  const customer =
    order.user?.name || order.user?.email || order.guestEmail || "Guest checkout";
  const created = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#0A4D3C]">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Placed {created} · <span className="text-slate-800">{customer}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <section className="lux-card grid gap-4 rounded-xl p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subtotal</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            Rs. {Number(order.subtotalAmount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shipping</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            Rs. {Number(order.shippingChargeAmount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tax</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            Rs. {Number(order.taxAmount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[#0A4D3C]">
            Rs. {Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">
          Update order
        </h2>
        <form action={patchOrderAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="id" value={order.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fulfillment status</label>
            <select
              name="orderStatus"
              defaultValue={order.orderStatus}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
            >
              {orderStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {String(s)
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Payment status</label>
            <select
              name="paymentStatus"
              defaultValue={order.paymentStatus}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
            >
              {paymentStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {String(s)
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Internal notes</label>
            <input
              name="notes"
              defaultValue={order.notes || ""}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
              placeholder="Team-only notes"
            />
          </div>
          <div className="md:col-span-full">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">
              Shipment & invoice
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {order.shipment?.status
                ? `Carrier status: ${order.shipment.status}`
                : "No shipment record yet."}
            </p>
            {order.shipment?.trackingUrl ? (
              <Link
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-[#0A4D3C] hover:underline"
              >
                Open tracking link
              </Link>
            ) : null}
          </div>
          <Link
            href={`/api/admin/orders/${order.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-md border border-[#0A4D3C]/25 bg-white px-4 text-sm font-medium text-[#0A4D3C] shadow-sm hover:bg-[#0A4D3C]/5"
          >
            Download invoice
          </Link>
        </div>
        <ShipmentActions orderId={order.id} adminKey={adminKey ?? ""} shipment={order.shipment} />
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">Line items</h2>
        <div className="space-y-3">
          {order.items.map((item) => {
            const thumb = pickLineThumb(item.product?.images);
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-[#0A4D3C]/10 bg-white/80 p-3 sm:flex-nowrap"
              >
                <div className="shrink-0">
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumb}
                      alt=""
                      className="h-14 w-14 rounded-lg border border-[#0A4D3C]/10 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-[#0A4D3C]/15 bg-slate-50 text-xs text-slate-400">
                      —
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.productTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">SKU reference · qty {item.quantity}</p>
                  <Link
                    href={`/admin/products/${item.product?.id ?? item.productId}`}
                    className="mt-1 inline-block text-xs font-medium text-[#0A4D3C] hover:underline"
                  >
                    Edit product
                  </Link>
                </div>
                <p className="shrink-0 tabular-nums text-sm font-semibold text-slate-900">
                  Rs. {Number(item.totalPrice).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
