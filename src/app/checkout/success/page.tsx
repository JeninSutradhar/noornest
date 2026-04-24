import Link from "next/link";
import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  const user = await getCurrentUser();

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paymentStatus: true,
          orderStatus: true,
          guestEmail: true,
          userId: true,
        },
      })
    : null;

  // Security: only show order to its owner or guest (no userId)
  const canView =
    order &&
    (order.userId === null || order.userId === user?.id);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="rounded-3xl border border-[#0A4D3C]/10 bg-white p-10 shadow-lg max-w-md w-full">
        <CheckCircle className="mx-auto h-16 w-16 text-[#0A4D3C]" />
        <h1 className="mt-4 text-2xl font-bold text-[#0A4D3C]">Order Placed!</h1>

        {canView ? (
          <>
            <p className="mt-2 text-slate-600">
              Thank you for your order. Your order number is{" "}
              <span className="font-semibold text-[#0A4D3C]">{order.orderNumber}</span>.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Total paid: <span className="font-medium">Rs. {Number(order.totalAmount).toFixed(2)}</span>
            </p>
            {order.guestEmail && (
              <p className="mt-1 text-sm text-slate-500">
                Confirmation will be sent to <span className="font-medium">{order.guestEmail}</span>.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-slate-600">
            Your payment was successful and your order has been placed.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {user ? (
            <Button asChild className="bg-[#0A4D3C] hover:bg-[#0A4D3C]/90">
              <Link href="/account/orders">View My Orders</Link>
            </Button>
          ) : (
            <Button asChild className="bg-[#0A4D3C] hover:bg-[#0A4D3C]/90">
              <Link href="/track-order">Track Your Order</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
