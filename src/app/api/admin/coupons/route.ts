import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { couponInputSchema } from "@/server/validators/admin";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdmin();
    return prisma.coupon.findMany({
      include: { productRules: true, categoryRules: true },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = couponInputSchema.parse(await request.json());
    const exists = await prisma.coupon.findUnique({ where: { code: body.code } });
    if (exists) throw new ApiError(409, "Coupon code already exists");
    return prisma.coupon.create({
      data: {
        code: body.code,
        type: body.type,
        value: body.value,
        minimumCartValue: body.minimumCartValue ?? null,
        maxDiscountAmount: body.maxDiscountAmount ?? null,
        startDate: new Date(body.startDate),
        expiryDate: new Date(body.expiryDate),
        usageLimitPerUser: body.usageLimitPerUser ?? null,
        usageLimitTotal: body.usageLimitTotal ?? null,
        scope: body.scope,
        status: body.status,
        productRules: {
          create: body.productIds.map((productId) => ({ productId })),
        },
        categoryRules: {
          create: body.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: { productRules: true, categoryRules: true },
    });
  });
}
