import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import {
  createFullShipment,
  type ShiprocketCreateOrderPayload,
} from "@/lib/integrations/shiprocket";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (!order.shippingAddress) {
      throw new ApiError(400, "Shipping address is required to create a shipment");
    }
    if (order.paymentStatus !== "PAID" && order.paymentProvider !== "COD") {
      throw new ApiError(400, "Order must be paid before creating a shipment");
    }

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
      // Default dimensions — admin can override via product settings later
      length: 15,
      breadth: 12,
      height: 8,
      weight: 0.5,
    };

    const result = await createFullShipment(payload);

    const shipment = await prisma.shipment.upsert({
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

    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: "PROCESSING" },
    });

    return { shipment, shiprocket: result };
  });
}
