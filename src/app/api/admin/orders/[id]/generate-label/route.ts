import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { generateLabel } from "@/lib/integrations/shiprocket";
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

    const res = await generateLabel(shipment.shiprocketShipmentId);
    const labelUrl = res.label_url ?? res.response?.label_url ?? null;

    return { labelUrl, label_created: res.label_created };
  });
}
