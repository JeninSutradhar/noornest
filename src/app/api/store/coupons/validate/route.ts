import { z } from "zod";

import { withApiHandler } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateCouponDiscount,
  isCouponApplicableForItems,
} from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(2),
  subtotal: z.number().nonnegative(),
  productIds: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const user = await getCurrentUser();
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: body.code,
        status: true,
        startDate: { lte: new Date() },
        expiryDate: { gte: new Date() },
      },
    });
    if (!coupon) return { valid: false, reason: "Coupon not found or expired" };
    if (coupon.minimumCartValue && body.subtotal < Number(coupon.minimumCartValue)) {
      return { valid: false, reason: "Minimum cart value not met" };
    }
    if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
      return { valid: false, reason: "Coupon usage limit reached" };
    }
    if (!user?.id && coupon.usageLimitPerUser) {
      return { valid: false, reason: "Login required for this coupon" };
    }
    if (user?.id && coupon.usageLimitPerUser) {
      const used = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: user.id },
      });
      if (used >= coupon.usageLimitPerUser) {
        return { valid: false, reason: "Per-user limit reached" };
      }
    }
    if (body.productIds.length > 0) {
      const applicable = await isCouponApplicableForItems(
        coupon.scope,
        coupon.id,
        body.productIds,
      );
      if (!applicable) {
        return { valid: false, reason: "Coupon not applicable to selected items" };
      }
    }
    const discount = calculateCouponDiscount(
      coupon.type,
      Number(coupon.value),
      body.subtotal,
      coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
    );
    return { valid: true, couponId: coupon.id, discount, scope: coupon.scope };
  });
}
