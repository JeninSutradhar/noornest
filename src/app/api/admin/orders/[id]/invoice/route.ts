import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { ensureInvoice } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, billingAddress: true, user: true },
    });
    if (!order) throw new ApiError(404, "Order not found");
    const invoice = await ensureInvoice(order.id);
    return { invoice, order };
  });
}
