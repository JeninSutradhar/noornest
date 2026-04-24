import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { verifyRazorpayPaymentSignature } from "@/lib/integrations/razorpay";
import {
  createFullShipment,
  type ShiprocketCreateOrderPayload,
} from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());

    // 1. Verify HMAC signature
    const valid = verifyRazorpayPaymentSignature(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );
    if (!valid) throw new ApiError(400, "Invalid payment signature");

    // 2. Confirm payment record belongs to this order
    const payment = await prisma.payment.findUnique({
      where: { orderId: body.orderId },
    });
    if (!payment) throw new ApiError(404, "Payment record not found");
    if (payment.razorpayOrderId !== body.razorpayOrderId) {
      throw new ApiError(400, "Razorpay order ID mismatch");
    }

    // 3. Mark payment PAID and order CONFIRMED
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: body.orderId },
        data: {
          status: "PAID",
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: body.orderId },
        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          confirmedAt: new Date(),
          razorpayPaymentId: body.razorpayPaymentId,
        },
      }),
    ]);

    // 4. Auto-create Shiprocket shipment (non-blocking — failure doesn't break payment)
    try {
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: { items: true, shippingAddress: true },
      });

      if (order?.shippingAddress) {
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
          payment_method: "Prepaid",
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
      }
    } catch (err) {
      // Log but don't fail — payment is already confirmed
      console.error("[Shiprocket] Auto-shipment creation failed:", err);
    }

    return { verified: true, orderId: body.orderId };
  });
}
