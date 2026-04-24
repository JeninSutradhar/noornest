import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApiHandler(async () => {
    const [slides, customSections, newArrivals] = await Promise.all([
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.homepageSection.findMany({
        where: { isActive: true, type: "CUSTOM" },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            orderBy: { sortOrder: "asc" },
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      }),
    ]);

    return {
      heroSlides: slides,
      sections: [
        {
          type: "NEW_ARRIVALS",
          title: "New Arrivals",
          productsToShow: 8,
          products: newArrivals,
        },
        ...customSections.map((section) => ({
          ...section,
          products: section.products
            .map((item) => item.product)
            .slice(0, section.productsToShow),
        })),
      ],
    };
  });
}
