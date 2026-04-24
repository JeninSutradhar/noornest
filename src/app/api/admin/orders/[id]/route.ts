import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  orderStatus: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"])
    .optional(),
  razorpayPaymentId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        shippingAddress: true,
        billingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                images: {
                  orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
                  take: 4,
                  select: { imageUrl: true, isFeatured: true, sortOrder: true },
                },
              },
            },
          },
        },
        shipment: true,
        payment: true,
        invoice: true,
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const now = new Date();
    return prisma.order.update({
      where: { id },
      data: {
        orderStatus: body.orderStatus,
        paymentStatus: body.paymentStatus,
        razorpayPaymentId: body.razorpayPaymentId,
        notes: body.notes,
        confirmedAt: body.orderStatus === "CONFIRMED" ? now : undefined,
        shippedAt: body.orderStatus === "SHIPPED" ? now : undefined,
        deliveredAt: body.orderStatus === "DELIVERED" ? now : undefined,
        cancelledAt: body.orderStatus === "CANCELLED" ? now : undefined,
      },
    });
  });
}
