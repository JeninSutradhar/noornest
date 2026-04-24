import { OrderStatus, PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const paymentProvider = searchParams.get("paymentMethod");
    const customer = searchParams.get("customer");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.OrderWhereInput = {
      ...(status ? { orderStatus: status as OrderStatus } : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
      ...(paymentProvider
        ? { paymentProvider: paymentProvider as PaymentProvider }
        : {}),
      ...(customer
        ? {
            OR: [
              { orderNumber: { contains: customer } },
              { guestEmail: { contains: customer } },
              { guestPhone: { contains: customer } },
              { user: { is: { name: { contains: customer } } } },
              { user: { is: { email: { contains: customer } } } },
            ],
          }
        : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          items: true,
          shipment: true,
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}
