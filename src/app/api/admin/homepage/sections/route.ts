import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { homepageSectionInputSchema } from "@/server/validators/admin";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdmin();
    return prisma.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: { product: true },
        },
      },
    });
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = homepageSectionInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.title);
    return prisma.homepageSection.create({
      data: {
        type: body.type,
        title: body.title,
        subtitle: body.subtitle ?? null,
        slug,
        productsToShow: body.productsToShow,
        isDefault: body.isDefault,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
        products: {
          create: body.productIds.map((productId, index) => ({
            productId,
            sortOrder: index,
          })),
        },
      },
      include: { products: true },
    });
  });
}
