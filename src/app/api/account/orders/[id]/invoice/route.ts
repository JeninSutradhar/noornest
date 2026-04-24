import { ApiError, withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ensureInvoice } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, shippingAddress: true, billingAddress: true },
    });
    if (!order) throw new ApiError(404, "Order not found");

    const invoice = await ensureInvoice(order.id);
    return {
      invoice,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotalAmount: order.subtotalAmount,
        shippingChargeAmount: order.shippingChargeAmount,
        taxAmount: order.taxAmount,
        couponDiscountAmount: order.couponDiscountAmount,
        totalAmount: order.totalAmount,
        items: order.items,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
      },
    };
  });
}
