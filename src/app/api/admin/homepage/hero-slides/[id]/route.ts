import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { heroSlideInputSchema } from "@/server/validators/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const body = heroSlideInputSchema.parse(await request.json());
    return prisma.heroSlide.update({ where: { id }, data: body });
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.heroSlide.delete({ where: { id } });
    return { id, deleted: true };
  });
}
