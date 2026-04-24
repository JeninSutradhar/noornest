import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { categoryInputSchema } from "@/server/validators/admin";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdmin();
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { children: true, parent: true },
    });
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = categoryInputSchema.parse(await request.json());
    const slug = body.slug ? toSlug(body.slug) : toSlug(body.name);
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) throw new ApiError(409, "Category slug already exists");
    return prisma.category.create({
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
