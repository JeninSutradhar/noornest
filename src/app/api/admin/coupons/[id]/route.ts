import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { couponInputSchema } from "@/server/validators/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = couponInputSchema.parse(await request.json());
    return prisma.coupon.update({
      where: { id },
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
          deleteMany: {},
          create: body.productIds.map((productId) => ({ productId })),
        },
        categoryRules: {
          deleteMany: {},
          create: body.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: { productRules: true, categoryRules: true },
    });
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.coupon.delete({ where: { id } });
    return { id, deleted: true };
  });
}
