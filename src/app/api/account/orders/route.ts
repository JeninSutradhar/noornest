import { parsePagination, withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { items: true, shipment: true, payment: true },
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}
