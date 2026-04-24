import Link from "next/link";

import { OrderStatusBadge } from "@/components/admin/status-badges";
import { adminApi } from "@/lib/admin-api";

export default async function AdminUsersPage() {
  const users = await adminApi<{
    items: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      totalOrders: number;
      totalSpent: number;
      lastOrderStatus?: string | null;
    }>;
  }>("/api/admin/users?pageSize=100");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Users</h1>
        <p className="mt-1 text-sm text-slate-600">Registered customers, lifetime spend, and quick links to profiles.</p>
      </div>
      <div className="lux-card rounded-xl p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-12 py-2 pr-2"> </th>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Phone</th>
                <th className="py-2 text-center">Orders</th>
                <th className="py-2 text-right">Spent</th>
                <th className="py-2 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {users.items.map((user) => {
                const initial = user.name?.trim().charAt(0).toUpperCase() || "?";
                return (
                  <tr key={user.id} className="border-t border-[#0A4D3C]/8">
                    <td className="py-3 pr-2 align-middle">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0A4D3C]/12 text-xs font-semibold text-[#0A4D3C]">
                        {initial}
                      </span>
                    </td>
                    <td className="py-3 align-middle">
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-[#0A4D3C] hover:underline">
                        {user.name}
                      </Link>
                      {user.lastOrderStatus ? (
                        <div className="mt-1">
                          <OrderStatusBadge status={user.lastOrderStatus} />
                        </div>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] truncate py-3 text-slate-700">{user.email}</td>
                    <td className="py-3 text-slate-600">{user.phone || "—"}</td>
                    <td className="py-3 text-center tabular-nums text-slate-800">{user.totalOrders}</td>
                    <td className="py-3 text-right tabular-nums font-medium text-slate-900">
                      Rs. {Number(user.totalSpent).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex rounded-md border border-[#0A4D3C]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#0A4D3C] shadow-sm hover:bg-[#0A4D3C]/5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
