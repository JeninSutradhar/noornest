import Link from "next/link";

import { adminApi } from "@/lib/admin-api";

type OrderDash = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: string | number;
  guestEmail?: string | null;
  user?: { name?: string | null } | null;
};
type ProductDash = {
  id: string;
  title?: string | null;
  totalRatings?: string | number | null;
  stockQuantity?: string | number | null;
};
type OrdersRes = { items: OrderDash[] };
type UsersRes = { items: Array<Record<string, unknown>> };
type ProductsRes = { items: ProductDash[] };

export default async function AdminDashboardPage() {
  const [orders, users, products] = await Promise.all([
    adminApi<OrdersRes>("/api/admin/orders?pageSize=20"),
    adminApi<UsersRes>("/api/admin/users?pageSize=20"),
    adminApi<ProductsRes>("/api/admin/products?pageSize=30"),
  ]);

  const totalRevenue = orders.items.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const lowStockCount = products.items.filter((item) => Number(item.stockQuantity) <= 5).length;
  const statusCount = new Map<string, number>();
  for (const item of orders.items) {
    const key = String(item.orderStatus ?? "UNKNOWN");
    statusCount.set(key, (statusCount.get(key) ?? 0) + 1);
  }
  const topSelling = [...products.items]
    .sort((a, b) => Number(b.totalRatings || 0) - Number(a.totalRatings || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={`Rs. ${totalRevenue.toFixed(2)}`} />
        <StatCard label="Total Orders" value={String(orders.items.length)} />
        <StatCard label="Total Customers" value={String(users.items.length)} />
        <StatCard label="Low Stock Products" value={String(lowStockCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="lux-card rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0A4D3C]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#0A4D3C]">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Order</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.slice(0, 8).map((order) => (
                  <tr key={order.id} className="border-t border-[#0A4D3C]/8">
                    <td className="py-2">
                      <Link className="text-[#0A4D3C]" href={`/admin/orders/${order.id}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2">{order.user?.name || order.guestEmail || "Guest"}</td>
                    <td className="py-2">{order.orderStatus}</td>
                    <td className="py-2 text-right">Rs. {Number(order.totalAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="lux-card rounded-xl p-5">
            <h2 className="mb-3 text-lg font-semibold text-[#0A4D3C]">Order Status Mix</h2>
            <div className="space-y-2 text-sm">
              {[...statusCount.entries()].map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-md bg-[#0A4D3C]/5 px-3 py-2">
                  <span>{status}</span>
                  <span className="font-semibold text-[#0A4D3C]">{count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lux-card rounded-xl p-5">
            <h2 className="mb-3 text-lg font-semibold text-[#0A4D3C]">Top Products</h2>
            <div className="space-y-2 text-sm">
              {topSelling.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <span>{product.title}</span>
                  <span className="text-slate-500">{product.totalRatings} ratings</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="lux-card rounded-xl p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#0A4D3C]">{value}</p>
    </article>
  );
}
