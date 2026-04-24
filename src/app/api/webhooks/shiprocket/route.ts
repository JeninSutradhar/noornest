import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { ShipmentStatus } from "@prisma/client";

// Shiprocket sends webhooks with these status codes
// Reference: https://apidocs.shiprocket.in/#webhook-events
const SR_STATUS_MAP: Record<string, ShipmentStatus> = {
  "1": "CREATED",
  "2": "PICKUP_SCHEDULED",
  "3": "PICKUP_SCHEDULED",
  "4": "IN_TRANSIT",
  "5": "IN_TRANSIT",
  "6": "OUT_FOR_DELIVERY",
  "7": "DELIVERED",
  "8": "CANCELLED",
  "9": "RETURNED",
  "10": "FAILED",
  "11": "RETURNED",
  "12": "IN_TRANSIT",
  "13": "FAILED",
  "14": "IN_TRANSIT",
  "15": "FAILED",
  "16": "RETURNED",
  "17": "RETURNED",
  "18": "FAILED",
  "19": "FAILED",
};

function mapStatus(srStatus: string | number | undefined): ShipmentStatus | null {
  if (!srStatus) return null;
  return SR_STATUS_MAP[String(srStatus)] ?? null;
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    // Shiprocket sends form-encoded or JSON depending on webhook type
    let body: Record<string, unknown>;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    }

    // Shiprocket webhook payload fields
    const awbCode = String(body.awb ?? body.awb_code ?? "").trim() || null;
    const srStatus = body.current_status_id ?? body.status_id ?? body.status;
    const mappedStatus = mapStatus(srStatus as string | number);
    const courierName = String(body.courier_name ?? "").trim() || null;
    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;
    const failureReason = String(body.remark ?? body.reason ?? "").trim() || null;

    // Find shipment by AWB code
    if (!awbCode) {
      return { acknowledged: true, skipped: "no awb_code" };
    }

    const shipment = await prisma.shipment.findFirst({
      where: { awbCode },
    });

    if (!shipment) {
      return { acknowledged: true, skipped: "shipment not found" };
    }

    const updateData: Record<string, unknown> = {
      lastSyncedAt: new Date(),
      courierName: courierName ?? shipment.courierName,
      trackingUrl: trackingUrl ?? shipment.trackingUrl,
    };
    if (mappedStatus) updateData.status = mappedStatus;
    if (failureReason) updateData.failureReason = failureReason;

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    // Sync order status for terminal states
    if (mappedStatus === "DELIVERED") {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: "DELIVERED", deliveredAt: new Date() },
      });
    } else if (mappedStatus === "IN_TRANSIT" || mappedStatus === "OUT_FOR_DELIVERY") {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: "SHIPPED", shippedAt: new Date() },
      });
    } else if (mappedStatus === "RETURNED" || mappedStatus === "CANCELLED") {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: "CANCELLED" },
      });
    }

    return { acknowledged: true };
  });
}
