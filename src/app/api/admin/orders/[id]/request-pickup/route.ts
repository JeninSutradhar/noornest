import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { requestPickup } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;

    const shipment = await prisma.shipment.findUnique({ where: { orderId: id } });
    if (!shipment) throw new ApiError(404, "Shipment not found for this order");
    if (!shipment.shiprocketShipmentId) {
      throw new ApiError(400, "Shiprocket shipment ID not available");
    }
    if (!shipment.awbCode) {
      throw new ApiError(400, "AWB must be assigned before requesting pickup");
    }

    const res = await requestPickup(shipment.shiprocketShipmentId);
    const pickupToken = res.response?.pickup_token_number ?? null;
    const pickupScheduledDate = res.response?.pickup_scheduled_date ?? null;

    const updated = await prisma.shipment.update({
      where: { orderId: id },
      data: {
        pickupRequested: true,
        pickupToken,
        status: "PICKUP_SCHEDULED",
        lastSyncedAt: new Date(),
      },
    });

    return { shipment: updated, pickupScheduledDate, pickupToken };
  });
}
