import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string(),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await request.json());

    const already = await prisma.review.findFirst({
      where: { productId: body.productId, userId: user.id, orderId: body.orderId ?? null },
      select: { id: true },
    });
    if (already) throw new ApiError(409, "Review already submitted");

    let isVerified = false;
    if (body.orderId) {
      const ordered = await prisma.orderItem.findFirst({
        where: {
          productId: body.productId,
          order: { id: body.orderId, userId: user.id },
        },
      });
      isVerified = Boolean(ordered);
    }

    return prisma.review.create({
      data: {
        productId: body.productId,
        userId: user.id,
        orderId: body.orderId ?? null,
        rating: body.rating,
        title: body.title ?? null,
        comment: body.comment ?? null,
        isVerified,
        status: "PENDING",
      },
    });
  });
}
