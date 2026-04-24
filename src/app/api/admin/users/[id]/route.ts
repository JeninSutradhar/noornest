import { requireAdmin } from "@/lib/admin-auth";
import { ApiError, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  });
}
