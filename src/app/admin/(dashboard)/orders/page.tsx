import Link from "next/link";

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { adminApi } from "@/lib/admin-api";

type Res = {
  items: Array<{
    id: string;
    orderNumber: string;
    user?: { name?: string | null } | null;
    guestEmail?: string | null;
    orderStatus: string;
    paymentStatus: string;
    totalAmount: string | number;
    createdAt?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const status = query.status ? `&status=${encodeURIComponent(query.status)}` : "";
  const paymentStatus = query.paymentStatus
    ? `&paymentStatus=${encodeURIComponent(query.paymentStatus)}`
    : "";
  const data = await adminApi<Res>(`/api/admin/orders?pageSize=100${status}${paymentStatus}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">Filter by fulfillment or payment state, then open an order to update details.</p>
      </div>
      <form method="get" action="/admin/orders" className="lux-card grid gap-3 rounded-xl p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Fulfillment status</label>
          <input
            name="status"
            defaultValue={query.status || ""}
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
            placeholder="e.g. PENDING"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Payment status</label>
          <input
            name="paymentStatus"
            defaultValue={query.paymentStatus || ""}
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
            placeholder="e.g. PAID"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-10 w-full rounded-md bg-[#0A4D3C] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#08382a]"
          >
            Apply filters
          </button>
        </div>
      </form>
      <div className="lux-card rounded-xl p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Fulfillment</th>
                <th className="py-2">Payment</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t border-[#0A4D3C]/8">
                  <td className="py-3 pr-4 align-middle">
                    <Link
                      href={`/admin/orders/${item.id}`}
                      className="font-medium text-[#0A4D3C] hover:underline"
                    >
                      {item.orderNumber}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate py-3 text-slate-700">
                    {item.user?.name || item.guestEmail || "Guest"}
                  </td>
                  <td className="py-3">
                    <OrderStatusBadge status={item.orderStatus} />
                  </td>
                  <td className="py-3">
                    <PaymentStatusBadge status={item.paymentStatus} />
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-slate-800">
                    Rs. {Number(item.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
