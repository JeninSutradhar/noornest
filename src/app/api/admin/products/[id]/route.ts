import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { productInputSchema } from "@/server/validators/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const item = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        variants: true,
      },
    });
    if (!item || item.deletedAt) throw new ApiError(404, "Product not found");
    return item;
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = productInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.title);

    const duplicate = await prisma.product.findFirst({
      where: {
        id: { not: id },
        OR: [{ slug }, { sku: body.sku }],
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(409, "Another product with same slug or SKU exists");
    }

    const updated = await prisma.product.update({
      where: { id },
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
        images: {
          deleteMany: {},
          create: body.images,
        },
        categories: {
          deleteMany: {},
          create: body.categoryIds.map((categoryId) => ({ categoryId })),
        },
        variants: {
          deleteMany: {},
          create: body.variants,
        },
      },
      include: {
        images: true,
        categories: { include: { category: true } },
        variants: true,
      },
    });
    return updated;
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });
    return { id, deleted: true };
  });
}
