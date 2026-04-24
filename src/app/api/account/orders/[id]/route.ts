import { ApiError, withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: true,
        shipment: true,
        payment: true,
        invoice: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  });
}
