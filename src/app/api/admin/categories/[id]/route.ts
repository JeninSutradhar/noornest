import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { categoryInputSchema } from "@/server/validators/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = categoryInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.name);
    const duplicate = await prisma.category.findFirst({
      where: { id: { not: id }, slug },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, "Category slug already exists");
    return prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        sortOrder: body.sortOrder,
        featured: body.featured,
        isActive: body.isActive,
        parentId: body.parentId ?? null,
      },
    });
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const linkedProducts = await prisma.productCategory.count({
      where: { categoryId: id },
    });
    if (linkedProducts > 0) {
      throw new ApiError(400, "Cannot delete category linked to products");
    }
    await prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  });
}
