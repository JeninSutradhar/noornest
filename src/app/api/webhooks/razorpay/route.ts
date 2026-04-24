import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature as verifyRazorpaySignature } from "@/lib/integrations/razorpay";

const schema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const valid = verifyRazorpaySignature(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );
    if (!valid) throw new ApiError(400, "Invalid Razorpay signature");

    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: body.orderId },
        data: {
          status: "PAID",
          razorpayOrderId: body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: body.orderId },
        data: { paymentStatus: "PAID", orderStatus: "CONFIRMED" },
      }),
    ]);

    return { acknowledged: true };
  });
}
