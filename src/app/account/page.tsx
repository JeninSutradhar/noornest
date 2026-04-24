import Link from "next/link";

import { updateProfileAction } from "@/app/account/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await requireUserOrRedirect("/account");
  const [ordersCount, addressesCount, reviewsCount, deliveredCount, spentAgg, recentOrders, defaultAddress] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, orderStatus: "DELIVERED" } }),
    prisma.order.aggregate({
      where: { userId: user.id, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.address.findFirst({
      where: { userId: user.id, isDefault: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">My Account</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/account/orders" className="lux-card rounded-xl p-5">
          <p className="text-sm text-slate-500">My Orders</p>
          <p className="text-2xl font-semibold text-[#0A4D3C]">{ordersCount}</p>
        </Link>
        <Link href="/account/addresses" className="lux-card rounded-xl p-5">
          <p className="text-sm text-slate-500">My Addresses</p>
          <p className="text-2xl font-semibold text-[#0A4D3C]">{addressesCount}</p>
        </Link>
        <Link href="/account/reviews" className="lux-card rounded-xl p-5">
          <p className="text-sm text-slate-500">My Reviews</p>
          <p className="text-2xl font-semibold text-[#0A4D3C]">{reviewsCount}</p>
        </Link>
        <div className="lux-card rounded-xl p-5">
          <p className="text-sm text-slate-500">Delivered Orders</p>
          <p className="text-2xl font-semibold text-[#0A4D3C]">{deliveredCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="lux-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-[#0A4D3C]">Profile Details</h2>
          <form action={updateProfileAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm text-slate-600">Full Name</p>
              <Input name="name" defaultValue={user.name} required />
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-600">Phone</p>
              <Input name="phone" defaultValue={user.phone || ""} required />
            </div>
            <div className="md:col-span-2">
              <p className="mb-1 text-sm text-slate-600">Email</p>
              <Input value={user.email} disabled />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <article className="lux-card rounded-xl p-5">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="mt-1 text-3xl font-semibold text-[#0A4D3C]">
              Rs. {Number(spentAgg._sum.totalAmount || 0).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Paid orders only</p>
          </article>
          <article className="lux-card rounded-xl p-5">
            <p className="text-sm font-medium text-[#0A4D3C]">Default Address</p>
            {defaultAddress ? (
              <div className="mt-2 text-sm text-slate-600">
                <p>{defaultAddress.fullName}</p>
                <p>{defaultAddress.line1}</p>
                <p>
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No default address set.</p>
            )}
            <Link href="/account/addresses" className="mt-3 inline-block text-sm text-[#0A4D3C]">
              Manage addresses
            </Link>
          </article>
        </section>
      </div>

      <section className="lux-card rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0A4D3C]">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-[#0A4D3C]">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-lg border border-[#0A4D3C]/10 p-3 text-sm hover:bg-[#0A4D3C]/[0.02]"
            >
              <span className="font-medium text-[#0A4D3C]">{order.orderNumber}</span>
              <span className="text-slate-500">{order.orderStatus}</span>
              <span className="font-medium text-slate-700">Rs. {Number(order.totalAmount).toFixed(2)}</span>
            </Link>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-sm text-slate-500">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
