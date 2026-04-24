import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { getShiprocketTracking } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderNumber: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    if (!body.email && !body.phone) {
      throw new ApiError(400, "Either email or phone is required");
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: body.orderNumber,
        OR: [
          ...(body.email
            ? [
                { guestEmail: body.email.toLowerCase() },
                { user: { email: body.email.toLowerCase() } },
              ]
            : []),
          ...(body.phone
            ? [
                { guestPhone: body.phone },
                { user: { phone: body.phone } },
              ]
            : []),
        ],
      },
      include: {
        items: true,
        shipment: true,
        payment: true,
      },
    });
    if (!order) throw new ApiError(404, "Order not found");

    // Fetch live tracking from Shiprocket if AWB is available
    let trackingActivities: unknown[] = [];
    if (order.shipment?.awbCode) {
      try {
        const trackingRes = await getShiprocketTracking(order.shipment.awbCode);
        trackingActivities =
          trackingRes.tracking_data?.shipment_track_activities ?? [];
      } catch {
        // Non-fatal — return order without live tracking
      }
    }

    return { order, trackingActivities };
  });
}
