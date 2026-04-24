import { Prisma, ShipmentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { parsePagination, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const failedOnly = searchParams.get("failedOnly") === "true";
    const pickupRequested = searchParams.get("pickupRequested");

    const where: Prisma.ShipmentWhereInput = {
      ...(status ? { status: status as ShipmentStatus } : {}),
      ...(failedOnly ? { status: "FAILED" } : {}),
      ...(pickupRequested ? { pickupRequested: pickupRequested === "true" } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { order: true },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  });
}
