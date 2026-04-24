import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { getShiprocketTracking } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// Maps Shiprocket status labels to our ShipmentStatus enum
function mapShiprocketStatus(
  srStatus: string | undefined,
): "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RETURNED" | null {
  if (!srStatus) return null;
  const s = srStatus.toUpperCase();
  if (s.includes("DELIVERED")) return "DELIVERED";
  if (s.includes("OUT FOR DELIVERY") || s.includes("OUT_FOR_DELIVERY")) return "OUT_FOR_DELIVERY";
  if (s.includes("RETURNED") || s.includes("RTO")) return "RETURNED";
  if (s.includes("FAILED") || s.includes("UNDELIVERED") || s.includes("LOST")) return "FAILED";
  if (s.includes("TRANSIT") || s.includes("SHIPPED") || s.includes("PICKED")) return "IN_TRANSIT";
  return null;
}

export async function POST(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;

    const shipment = await prisma.shipment.findUnique({ where: { orderId: id } });
    if (!shipment) throw new ApiError(404, "Shipment not found for this order");
    if (!shipment.awbCode) {
      throw new ApiError(400, "AWB code not available — cannot sync tracking");
    }

    const trackingRes = await getShiprocketTracking(shipment.awbCode);
    const trackData = trackingRes.tracking_data;
    const shipmentTrack = trackData?.shipment_track?.[0];
    const currentStatus = shipmentTrack?.current_status;
    const mappedStatus = mapShiprocketStatus(currentStatus);

    const updateData: Record<string, unknown> = {
      lastSyncedAt: new Date(),
      trackingUrl: trackData?.track_url ?? shipment.trackingUrl,
    };
    if (mappedStatus) updateData.status = mappedStatus;

    const updated = await prisma.shipment.update({
      where: { orderId: id },
      data: updateData,
    });

    // Sync order status for terminal states
    if (mappedStatus === "DELIVERED") {
      await prisma.order.update({
        where: { id },
        data: { orderStatus: "DELIVERED", deliveredAt: new Date() },
      });
    } else if (mappedStatus === "RETURNED") {
      await prisma.order.update({
        where: { id },
        data: { orderStatus: "CANCELLED" },
      });
    }

    return {
      shipment: updated,
      currentStatus,
      activities: trackData?.shipment_track_activities ?? [],
    };
  });
}
