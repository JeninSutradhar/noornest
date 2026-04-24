import Link from "next/link";

import { OrderStatusBadge } from "@/components/admin/status-badges";
import { adminApi } from "@/lib/admin-api";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await adminApi<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    createdAt?: string;
    addresses: Array<{
      id: string;
      fullName: string;
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
      postalCode?: string | null;
      country?: string | null;
    }>;
    orders: Array<{
      id: string;
      orderNumber: string;
      orderStatus: string;
      totalAmount: string | number;
      createdAt: string;
    }>;
  }>(`/api/admin/users/${id}`);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="text-xs font-medium text-[#0A4D3C] hover:underline"
          >
            ← All users
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#0A4D3C]">{user.name}</h1>
          {memberSince ? <p className="mt-1 text-sm text-slate-500">Member since {memberSince}</p> : null}
        </div>
      </div>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">Contact</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1">
              <a href={`mailto:${user.email}`} className="text-sm font-medium text-[#0A4D3C] hover:underline">
                {user.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
            <dd className="mt-1 text-sm text-slate-800">{user.phone || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">Saved addresses</h2>
        {user.addresses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No addresses on file.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {user.addresses.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-[#0A4D3C]/10 bg-white/90 p-4 text-sm text-slate-700 shadow-sm"
              >
                <p className="font-medium text-slate-900">{a.fullName}</p>
                <p className="mt-2 leading-relaxed">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state}
                  {a.postalCode ? ` ${a.postalCode}` : ""}
                  {a.country ? ` · ${a.country}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">Orders</h2>
          <span className="text-xs text-slate-500">{user.orders.length} total</span>
        </div>
        {user.orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0A4D3C]/10 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                  <th className="pb-3 text-right font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {user.orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#0A4D3C]/8">
                    <td className="py-3 pr-4 align-middle">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-[#0A4D3C] hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 align-middle text-slate-600">
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 align-middle">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="py-3 text-right align-middle tabular-nums font-medium text-slate-900">
                      Rs. {Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right align-middle">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-medium text-[#0A4D3C] hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
