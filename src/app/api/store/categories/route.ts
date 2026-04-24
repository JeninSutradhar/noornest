import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApiHandler(async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        productCategories: {
          take: 1,
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
            },
          },
        },
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }).then((rows) =>
      rows.map((row) => ({
        ...row,
        coverImageUrl:
          row.imageUrl || row.productCategories[0]?.product.images[0]?.imageUrl || null,
      })),
    );
  });
}
