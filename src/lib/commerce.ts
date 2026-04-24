import { DiscountScope } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getTaxConfig() {
  const rows = await prisma.adminSetting.findMany({
    where: { groupKey: "tax", key: { in: ["enable_gst", "gst_rate"] } },
  });
  const enableRow = rows.find((row) => row.key === "enable_gst");
  const rateRow = rows.find((row) => row.key === "gst_rate");
  const enabled = Boolean(enableRow?.valueJson ?? false);
  const rate = Number(rateRow?.valueJson ?? 0);
  return {
    enabled,
    rate: Number.isFinite(rate) && rate >= 0 ? rate : 0,
  };
}

export function calculateCouponDiscount(
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  value: number,
  subtotal: number,
  maxDiscountAmount?: number | null,
) {
  let discount = type === "PERCENTAGE" ? (subtotal * value) / 100 : value;
  if (maxDiscountAmount != null) {
    discount = Math.min(discount, maxDiscountAmount);
  }
  return Math.max(0, Math.min(discount, subtotal));
}

export async function isCouponApplicableForItems(
  scope: DiscountScope,
  couponId: string,
  productIds: string[],
) {
  if (scope === "ALL") return true;

  if (scope === "PRODUCTS") {
    const count = await prisma.couponProductRule.count({
      where: { couponId, productId: { in: productIds } },
    });
    return count > 0;
  }

  const categoryLinks = await prisma.productCategory.count({
    where: {
      productId: { in: productIds },
      category: { couponCategoryRules: { some: { couponId } } },
    },
  });
  return categoryLinks > 0;
}
