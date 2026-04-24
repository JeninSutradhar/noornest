import { Prisma } from "@prisma/client";

import { parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const q = searchParams.get("q");
    const categorySlug = searchParams.get("category");
    const featured = searchParams.get("featured");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const tags = searchParams.get("tags");

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { shortDescription: { contains: q } },
              { sku: { contains: q } },
            ],
          }
        : {}),
      ...(categorySlug
        ? {
            categories: {
              some: {
                category: { slug: categorySlug, isActive: true },
              },
            },
          }
        : {}),
      ...(featured ? { featured: featured === "true" } : {}),
      ...(minPrice || maxPrice
        ? {
            regularPrice: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          categories: { include: { category: true } },
          variants: { where: { isActive: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const finalItems = tags
      ? items.filter((product) => {
          const raw = product.tagsJson;
          const productTags = Array.isArray(raw)
            ? raw.filter((tag): tag is string => typeof tag === "string")
            : [];
          return tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .some((needle) => productTags.some((tag) => tag.toLowerCase() === needle));
        })
      : items;

    return {
      items: finalItems,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}
