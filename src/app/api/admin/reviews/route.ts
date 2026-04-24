import { Prisma, ReviewStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");

    const where: Prisma.ReviewWhereInput = {
      ...(status ? { status: status as ReviewStatus } : {}),
      ...(productId ? { productId } : {}),
    };

    const [items, total, aggregates] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { product: true, user: true },
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ["productId"],
        _avg: { rating: true },
        _count: { productId: true },
      }),
    ]);

    return {
      items,
      productRatings: aggregates,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { reviewId, status } = z
      .object({ reviewId: z.string(), status: statusSchema.shape.status })
      .parse(await request.json());

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    const approved = await prisma.review.aggregate({
      where: { productId: review.productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        avgRating: approved._avg.rating ?? 0,
        totalRatings: approved._count.id,
      },
    });

    return review;
  });
}
