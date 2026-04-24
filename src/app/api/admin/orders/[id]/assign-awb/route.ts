import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { assignAWB } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;

    const shipment = await prisma.shipment.findUnique({ where: { orderId: id } });
    if (!shipment) throw new ApiError(404, "Shipment not found for this order");
    if (!shipment.shiprocketShipmentId) {
      throw new ApiError(400, "Shiprocket shipment ID not available — create shipment first");
    }

    const res = await assignAWB(shipment.shiprocketShipmentId);
    const data = res.response?.data;

    const awbCode = data?.awb_code ?? null;
    const courierName = data?.courier_name ?? null;
    const courierCode = data?.courier_company_id ? String(data.courier_company_id) : null;
    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;

    const updated = await prisma.shipment.update({
      where: { orderId: id },
      data: {
        awbCode,
        courierName,
        courierCode,
        trackingUrl,
        status: awbCode ? "CREATED" : shipment.status,
        lastSyncedAt: new Date(),
      },
    });

    return { shipment: updated, awb_assign_status: res.awb_assign_status };
  });
}
