import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { createRazorpayOrder } from "@/lib/integrations/razorpay";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    if (!order) throw new ApiError(404, "Order not found");

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(Number(order.totalAmount) * 100),
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    });

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        provider: "RAZORPAY",
        razorpayOrderId: razorpayOrder.id,
        amount: Number(order.totalAmount),
        currency: razorpayOrder.currency,
        status: "PENDING",
      },
      create: {
        orderId: order.id,
        provider: "RAZORPAY",
        razorpayOrderId: razorpayOrder.id,
        amount: Number(order.totalAmount),
        currency: razorpayOrder.currency,
        status: "PENDING",
      },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      payment,
    };
  });
}
