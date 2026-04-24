import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { generateManifest } from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { orderIds } = schema.parse(await request.json());

    const shipments = await prisma.shipment.findMany({
      where: { orderId: { in: orderIds }, shiprocketShipmentId: { not: null } },
      select: { shiprocketShipmentId: true },
    });

    const shipmentIds = shipments
      .map((s) => s.shiprocketShipmentId!)
      .filter(Boolean);

    const res = await generateManifest(shipmentIds);
    return { manifestUrl: res.manifest_url ?? null };
  });
}
