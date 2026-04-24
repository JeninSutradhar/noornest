import { prisma } from "@/lib/prisma";

export async function getHomepageData() {
  const [heroSlides, featuredCategories, sections, reviews] = await Promise.all([
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: { featured: true, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 8,
      include: {
        productCategories: {
          take: 1,
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
            },
          },
        },
      },
    }),
    prisma.homepageSection.findMany({
      where: { isActive: true },
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
    prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { user: true, product: true },
      take: 12,
    }),
  ]);

  const newArrivals = await prisma.product.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 8,
  });

  return {
    heroSlides,
    featuredCategories: featuredCategories.map((category) => ({
      ...category,
      coverImageUrl:
        category.imageUrl ||
        category.productCategories[0]?.product.images[0]?.imageUrl ||
        null,
    })),
    reviews,
    sections: [
      {
        id: "new-arrivals",
        type: "NEW_ARRIVALS" as const,
        title: "New Arrivals",
        subtitle: "Latest additions to NoorNest",
        productsToShow: 8,
        products: newArrivals,
      },
      ...sections.map((section) => ({
        ...section,
        products: section.products
          .map((entry) => entry.product)
          .filter((product) => product.status === "ACTIVE" && !product.deletedAt)
          .slice(0, section.productsToShow),
      })),
    ],
  };
}

export async function getShopProducts(params?: {
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  featured?: boolean;
  stock?: "in" | "out";
  material?: string;
  color?: string;
}) {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      ...(params?.q
        ? {
            OR: [
              { title: { contains: params.q } },
              { shortDescription: { contains: params.q } },
            ],
          }
        : {}),
      ...(params?.categorySlug
        ? { categories: { some: { category: { slug: params.categorySlug } } } }
        : {}),
      ...(params?.featured ? { featured: true } : {}),
      ...(params?.stock === "in" ? { stockQuantity: { gt: 0 } } : {}),
      ...(params?.stock === "out" ? { stockQuantity: { lte: 0 } } : {}),
      ...(params?.minPrice || params?.maxPrice
        ? {
            regularPrice: {
              ...(params.minPrice ? { gte: params.minPrice } : {}),
              ...(params.maxPrice ? { lte: params.maxPrice } : {}),
            },
          }
        : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      categories: { include: { category: true } },
      variants: { where: { isActive: true } },
      reviews: { where: { status: "APPROVED" } },
    },
    orderBy:
      params?.sort === "price_asc"
        ? { regularPrice: "asc" }
        : params?.sort === "price_desc"
          ? { regularPrice: "desc" }
          : { createdAt: "desc" },
  });

  const filtered = products.filter((product) => {
    const attrs =
      product.attributesJson && typeof product.attributesJson === "object"
        ? (product.attributesJson as Record<string, unknown>)
        : {};
    const material = String(attrs.material ?? "").toLowerCase();
    const color = String(attrs.color ?? "").toLowerCase();
    const materialOk = params?.material
      ? material.includes(params.material.toLowerCase())
      : true;
    const colorOk = params?.color
      ? color.includes(params.color.toLowerCase())
      : true;
    return materialOk && colorOk;
  });

  return filtered;
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      variants: { where: { isActive: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
