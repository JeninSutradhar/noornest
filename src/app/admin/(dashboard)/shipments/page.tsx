import Link from "next/link";

import { adminApi } from "@/lib/admin-api";
import { getAdminKeyFromCookie } from "@/lib/admin-session";
import { BulkShipmentActions } from "@/components/admin/bulk-shipment-actions";

const STATUS_OPTIONS = [
  "", "PENDING", "CREATED", "PICKUP_SCHEDULED",
  "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED",
  "FAILED", "RETURNED", "CANCELLED",
];

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const status = query.status ? `&status=${encodeURIComponent(query.status)}` : "";

  const [shipments, adminKey] = await Promise.all([
    adminApi<{
    items: Array<{
      id: string;
      orderId: string;
      status: string;
      awbCode?: string | null;
      courierName?: string | null;
      trackingUrl?: string | null;
      pickupRequested?: boolean;
      lastSyncedAt?: string | null;
      order?: {
        id?: string;
        orderNumber?: string | null;
        paymentStatus?: string;
        orderStatus?: string;
      } | null;
    }>;
    pagination: { total: number };
  }>(`/api/admin/shipments?pageSize=100${status}`),
    getAdminKeyFromCookie(),
  ]);

  const statusColor: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    CREATED: "bg-blue-50 text-blue-700",
    PICKUP_SCHEDULED: "bg-amber-50 text-amber-700",
    IN_TRANSIT: "bg-indigo-50 text-indigo-700",
    OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700",
    DELIVERED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
    RETURNED: "bg-orange-50 text-orange-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Shipments</h1>
        <span className="text-sm text-slate-500">{shipments.pagination.total} total</span>
      </div>

      {/* Filters */}
      <form className="lux-card flex flex-wrap gap-3 rounded-xl p-4">
        <select
          name="status"
          defaultValue={query.status || ""}
          className="h-10 rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-[#0A4D3C] px-4 text-sm text-white"
        >
          Filter
        </button>
      </form>

      {/* Bulk actions */}
      <BulkShipmentActions orderIds={shipments.items.map((s) => s.orderId)} adminKey={adminKey ?? ""} />

      {/* Table */}
      <div className="lux-card rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">AWB</th>
                <th className="py-2 pr-4">Courier</th>
                <th className="py-2 pr-4">Pickup</th>
                <th className="py-2 pr-4">Last Synced</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.items.map((item) => (
                <tr key={item.id} className="border-t border-[#0A4D3C]/8">
                  <td className="py-2 pr-4">
                    {item.order?.id ? (
                      <Link
                        href={`/admin/orders/${item.order.id}`}
                        className="font-medium text-[#0A4D3C] hover:underline"
                      >
                        {item.order.orderNumber || item.orderId}
                      </Link>
                    ) : (
                      item.orderId
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColor[item.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {item.awbCode || "—"}
                  </td>
                  <td className="py-2 pr-4">{item.courierName || "—"}</td>
                  <td className="py-2 pr-4">
                    {item.pickupRequested ? (
                      <span className="text-green-600">✓ Requested</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-400">
                    {item.lastSyncedAt
                      ? new Date(item.lastSyncedAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {item.trackingUrl && (
                        <a
                          href={item.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#0A4D3C] hover:underline"
                        >
                          Track ↗
                        </a>
                      )}
                      {item.order?.id && (
                        <Link
                          href={`/admin/orders/${item.order.id}`}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          Order →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shipments.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No shipments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
