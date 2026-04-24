import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const { slug } = await context.params;
    const product = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE", deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
        categories: { include: { category: true } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!product) throw new ApiError(404, "Product not found");
    return product;
  });
}
