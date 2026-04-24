import { requireAdmin } from "@/lib/admin-auth";
import { parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const search = searchParams.get("search");

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          addresses: true,
          orders: {
            select: { id: true, totalAmount: true, createdAt: true, orderStatus: true },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const enriched = users.map((user) => {
      const totalOrders = user.orders.length;
      const totalSpent = user.orders.reduce(
        (acc, item) => acc + Number(item.totalAmount),
        0,
      );
      const lastOrderDate = user.orders[0]?.createdAt ?? null;
      const lastOrderStatus = user.orders[0]?.orderStatus ?? null;
      return { ...user, totalOrders, totalSpent, lastOrderDate, lastOrderStatus };
    });

    return {
      items: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}
