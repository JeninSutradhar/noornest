import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { homepageSectionInputSchema } from "@/server/validators/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = homepageSectionInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.title);
    return prisma.homepageSection.update({
      where: { id },
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
          deleteMany: {},
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

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.homepageSection.delete({ where: { id } });
    return { id, deleted: true };
  });
}
