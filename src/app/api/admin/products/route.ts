import { Prisma, ProductStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { productInputSchema } from "@/server/validators/admin";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);

    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");
    const stockStatus = searchParams.get("stockStatus");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const islamicTag = searchParams.get("islamicTag");

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { sku: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      ...(status ? { status: status as ProductStatus } : {}),
      ...(featured ? { featured: featured === "true" } : {}),
      ...(stockStatus === "in_stock" ? { stockQuantity: { gt: 0 } } : {}),
      ...(stockStatus === "out_of_stock" ? { stockQuantity: { lte: 0 } } : {}),
      ...(minPrice || maxPrice
        ? {
            regularPrice: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    };

    const items = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        categories: { include: { category: true } },
      },
    });

    const filteredByTag = islamicTag
      ? items.filter((item) => {
          const tags = Array.isArray(item.tagsJson) ? item.tagsJson : [];
          return tags.some(
            (tag) =>
              typeof tag === "string" &&
              tag.toLowerCase().includes(islamicTag.toLowerCase()),
          );
        })
      : items;
    const total = filteredByTag.length;
    const pagedItems = filteredByTag.slice(skip, skip + take);

    return {
      items: pagedItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = productInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.title);
    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku: body.sku }] },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(409, "Product with same slug or SKU already exists");
    }

    const created = await prisma.product.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        shortDescription: body.shortDescription ?? null,
        regularPrice: body.regularPrice,
        salePrice: body.salePrice ?? null,
        sku: body.sku,
        stockQuantity: body.stockQuantity,
        weightKg: body.weightKg,
        dimensionLengthCm: body.dimensionLengthCm,
        dimensionWidthCm: body.dimensionWidthCm,
        dimensionHeightCm: body.dimensionHeightCm,
        variantType: body.variantType ?? null,
        attributesJson: (body.attributesJson ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        tagsJson: (body.tagsJson ?? undefined) as Prisma.InputJsonValue | undefined,
        featured: body.featured,
        status: body.status,
        metaTitle: body.metaTitle ?? null,
        metaDescription: body.metaDescription ?? null,
        islamicComplianceNote: body.islamicComplianceNote ?? null,
        images: { create: body.images },
        categories: {
          create: body.categoryIds.map((categoryId) => ({ categoryId })),
        },
        variants: { create: body.variants },
      },
      include: {
        images: true,
        categories: { include: { category: true } },
        variants: true,
      },
    });

    return created;
  });
}
