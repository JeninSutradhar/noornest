import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import {
  createFullShipment,
  type ShiprocketCreateOrderPayload,
} from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderIds: z.array(z.string()).min(1).max(50),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { orderIds } = schema.parse(await request.json());

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        OR: [{ paymentStatus: "PAID" }, { paymentProvider: "COD" }],
        shipment: null, // only orders without existing shipment
      },
      include: { items: true, shippingAddress: true },
    });

    const results: Array<{ orderId: string; success: boolean; error?: string }> = [];

    for (const order of orders) {
      if (!order.shippingAddress) {
        results.push({ orderId: order.id, success: false, error: "No shipping address" });
        continue;
      }

      try {
        const payload: ShiprocketCreateOrderPayload = {
          order_id: order.orderNumber,
          order_date: order.createdAt.toISOString().split("T")[0],
          billing_customer_name: order.shippingAddress.fullName,
          billing_address: order.shippingAddress.line1,
          billing_address_2: order.shippingAddress.line2 ?? "",
          billing_city: order.shippingAddress.city,
          billing_state: order.shippingAddress.state,
          billing_country: order.shippingAddress.country,
          billing_pincode: order.shippingAddress.postalCode,
          billing_phone: order.shippingAddress.phone,
          billing_email: order.shippingAddress.email ?? undefined,
          shipping_is_billing: true,
          order_items: order.items.map((item) => ({
            name: item.productTitle,
            sku: item.productSku,
            units: item.quantity,
            selling_price: Number(item.unitPrice),
          })),
          payment_method: order.paymentProvider === "COD" ? "COD" : "Prepaid",
          sub_total: Number(order.subtotalAmount),
          shipping_charges: Number(order.shippingChargeAmount),
          total_discount: Number(order.couponDiscountAmount),
          length: 15,
          breadth: 12,
          height: 8,
          weight: 0.5,
        };

        const result = await createFullShipment(payload);

        await prisma.shipment.upsert({
          where: { orderId: order.id },
          update: {
            shiprocketOrderId: result.shiprocketOrderId,
            shiprocketShipmentId: result.shiprocketShipmentId,
            awbCode: result.awbCode,
            courierName: result.courierName,
            courierCode: result.courierCode,
            trackingUrl: result.trackingUrl,
            pickupRequested: result.pickupToken !== null,
            pickupToken: result.pickupToken,
            status: result.pickupToken ? "PICKUP_SCHEDULED" : result.awbCode ? "CREATED" : "PENDING",
            lastSyncedAt: new Date(),
          },
          create: {
            orderId: order.id,
            shiprocketOrderId: result.shiprocketOrderId,
            shiprocketShipmentId: result.shiprocketShipmentId,
            awbCode: result.awbCode,
            courierName: result.courierName,
            courierCode: result.courierCode,
            trackingUrl: result.trackingUrl,
            pickupRequested: result.pickupToken !== null,
            pickupToken: result.pickupToken,
            status: result.pickupToken ? "PICKUP_SCHEDULED" : result.awbCode ? "CREATED" : "PENDING",
            lastSyncedAt: new Date(),
          },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { orderStatus: "PROCESSING" },
        });

        results.push({ orderId: order.id, success: true });
      } catch (err) {
        results.push({
          orderId: order.id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { results, total: results.length, succeeded: results.filter((r) => r.success).length };
  });
}
