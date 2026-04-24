import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateCouponDiscount,
  getTaxConfig,
  isCouponApplicableForItems,
} from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  shippingAddressId: z.string().optional(),
  billingAddressId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        // empty string from cookie should be treated as no variant
        variantId: z.string().optional().transform((v) => (v === "" ? undefined : v)),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  couponCode: z.string().optional(),
  paymentProvider: z.enum(["RAZORPAY", "COD", "BANK_TRANSFER"]).default("RAZORPAY"),
});

function makeOrderNumber() {
  return `NN-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

async function createUniqueOrderNumber() {
  for (let i = 0; i < 5; i += 1) {
    const orderNumber = makeOrderNumber();
    const exists = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!exists) return orderNumber;
  }
  throw new ApiError(500, "Failed to generate unique order number");
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const sessionUser = await getCurrentUser();
    const effectiveUserId = sessionUser?.id ?? null;
    if (!effectiveUserId && !body.guestEmail) {
      throw new ApiError(400, "guestEmail is required for guest checkout");
    }
    if (effectiveUserId && body.shippingAddressId) {
      const shippingAddress = await prisma.address.findFirst({
        where: { id: body.shippingAddressId, userId: effectiveUserId },
        select: { id: true },
      });
      if (!shippingAddress) throw new ApiError(403, "Invalid shipping address");
    }
    if (effectiveUserId && body.billingAddressId) {
      const billingAddress = await prisma.address.findFirst({
        where: { id: body.billingAddressId, userId: effectiveUserId },
        select: { id: true },
      });
      if (!billingAddress) throw new ApiError(403, "Invalid billing address");
    }

    // Deduplicate product IDs before querying (cart may have same product with different variants)
    const productIds = [...new Set(body.items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, status: "ACTIVE" },
      include: { variants: true },
    });
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new ApiError(400, `One or more products are unavailable: ${missing.join(", ")}`);
    }

    const orderItems = body.items.map((item) => {
      const product = products.find((productItem) => productItem.id === item.productId);
      if (!product) throw new ApiError(400, "Product not found");
      if (item.quantity > product.stockQuantity) {
        throw new ApiError(400, `Insufficient stock for ${product.title}`);
      }
      // Treat empty string variantId as no variant
      const variantId = item.variantId && item.variantId.trim() !== "" ? item.variantId : null;
      const variant = variantId
        ? product.variants.find((variantItem) => variantItem.id === variantId)
        : null;
      if (variantId && !variant) {
        throw new ApiError(400, `Variant not found for ${product.title}`);
      }
      if (variant && item.quantity > variant.stockQuantity) {
        throw new ApiError(400, `Insufficient variant stock for ${product.title}`);
      }
      const unitPrice = Number(variant?.salePrice ?? variant?.regularPrice ?? product.salePrice ?? product.regularPrice);
      return {
        productId: product.id,
        variantId: variant?.id ?? null,
        productTitle: product.title,
        productSlug: product.slug,
        productSku: variant?.sku ?? product.sku,
        variantLabel: variant?.value ?? null,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
    let couponDiscountAmount = 0;

    let appliedCoupon: { id: string } | null = null;
    if (body.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: body.couponCode,
          status: true,
          startDate: { lte: new Date() },
          expiryDate: { gte: new Date() },
        },
      });
      if (coupon) {
        if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
          throw new ApiError(400, "Coupon usage limit reached");
        }
        if (effectiveUserId && coupon.usageLimitPerUser) {
          const usedByUser = await prisma.couponUsage.count({
            where: { couponId: coupon.id, userId: effectiveUserId },
          });
          if (usedByUser >= coupon.usageLimitPerUser) {
            throw new ApiError(400, "Coupon per-user limit reached");
          }
        }
        if (!effectiveUserId && coupon.usageLimitPerUser) {
          throw new ApiError(400, "Login required for this coupon");
        }
        const couponApplicable = await isCouponApplicableForItems(
          coupon.scope,
          coupon.id,
          orderItems.map((item) => item.productId),
        );
        if (!couponApplicable) {
          throw new ApiError(400, "Coupon is not applicable for selected items");
        }
        appliedCoupon = { id: coupon.id };
        if (coupon.minimumCartValue && subtotal < Number(coupon.minimumCartValue)) {
          throw new ApiError(400, "Minimum cart value not met for coupon");
        }
        couponDiscountAmount = calculateCouponDiscount(
          coupon.type,
          Number(coupon.value),
          subtotal,
          coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
        );
      } else {
        throw new ApiError(400, "Invalid coupon code");
      }
    }

    const taxConfig = await getTaxConfig();
    const shippingChargeAmount = subtotal >= 1499 ? 0 : 99;
    const taxableAmount = subtotal - couponDiscountAmount;
    const taxAmount = taxConfig.enabled
      ? Number(((taxableAmount * taxConfig.rate) / 100).toFixed(2))
      : 0;
    const totalAmount = taxableAmount + shippingChargeAmount + taxAmount;
    const orderNumber = await createUniqueOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: effectiveUserId,
          guestEmail: body.guestEmail ?? null,
          guestPhone: body.guestPhone ?? null,
          paymentProvider: body.paymentProvider,
          subtotalAmount: subtotal,
          shippingChargeAmount,
          couponDiscountAmount,
          taxAmount,
          totalAmount,
          shippingAddressId: body.shippingAddressId ?? null,
          billingAddressId: body.billingAddressId ?? null,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      await Promise.all(
        orderItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          }),
        ),
      );

      await Promise.all(
        orderItems
          .filter((item) => item.variantId)
          .map((item) =>
            tx.productVariant.update({
              where: { id: item.variantId! },
              data: { stockQuantity: { decrement: item.quantity } },
            }),
          ),
      );

      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: appliedCoupon.id,
            orderId: createdOrder.id,
            userId: effectiveUserId,
            discountAmount: couponDiscountAmount,
          },
        });
      }

      return createdOrder;
    });

    return order;
  });
}
