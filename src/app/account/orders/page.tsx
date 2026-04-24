import Link from "next/link";

import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountOrdersPage() {
  const user = await requireUserOrRedirect("/account/orders");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { shipment: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">My Orders</h1>
      {orders.length === 0 && (
        <div className="rounded-xl border border-[#0A4D3C]/10 bg-white p-6 text-sm text-slate-500">
          No orders yet. Browse <Link href="/shop" className="text-[#0A4D3C]">our collection</Link>.
        </div>
      )}
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block rounded-xl border border-[#0A4D3C]/10 bg-white p-4 hover:border-[#0A4D3C]/25"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#0A4D3C]">{order.orderNumber}</p>
              <p className="text-sm text-slate-500">
                {order.orderStatus} • {order.paymentStatus}
              </p>
              {order.shipment?.trackingUrl && (
                <span className="mt-1 inline-block text-xs text-[#0A4D3C]">Tracking available</span>
              )}
            </div>
            <p className="font-semibold text-[#0A4D3C]">Rs. {Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
