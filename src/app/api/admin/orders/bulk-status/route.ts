import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ids: z.array(z.string()).min(1),
  orderStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const now = new Date();
    const result = await prisma.order.updateMany({
      where: { id: { in: body.ids } },
      data: {
        orderStatus: body.orderStatus,
        confirmedAt: body.orderStatus === "CONFIRMED" ? now : undefined,
        shippedAt: body.orderStatus === "SHIPPED" ? now : undefined,
        deliveredAt: body.orderStatus === "DELIVERED" ? now : undefined,
        cancelledAt: body.orderStatus === "CANCELLED" ? now : undefined,
      },
    });
    return { updatedCount: result.count };
  });
}
