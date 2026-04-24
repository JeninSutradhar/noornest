import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { cancelShiprocketOrder } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;

    const shipment = await prisma.shipment.findUnique({ where: { orderId: id } });
    if (!shipment) throw new ApiError(404, "Shipment not found for this order");
    if (!shipment.shiprocketOrderId) {
      throw new ApiError(400, "Shiprocket order ID not available");
    }

    await cancelShiprocketOrder([shipment.shiprocketOrderId]);

    const updated = await prisma.shipment.update({
      where: { orderId: id },
      data: { status: "CANCELLED", lastSyncedAt: new Date() },
    });

    await prisma.order.update({
      where: { id },
      data: { orderStatus: "CANCELLED", cancelledAt: new Date() },
    });

    return { shipment: updated };
  });
}
