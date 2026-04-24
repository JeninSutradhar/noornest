import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ids: z.array(z.string()).min(1),
  stockQuantity: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),
  regularPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().nullable().optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const updates = Object.fromEntries(
      Object.entries({
        stockQuantity: body.stockQuantity,
        status: body.status,
        regularPrice: body.regularPrice,
        salePrice: body.salePrice,
        featured: body.featured,
      }).filter(([, value]) => value !== undefined),
    );

    const result = await prisma.product.updateMany({
      where: { id: { in: body.ids }, deletedAt: null },
      data: updates,
    });
    return { updatedCount: result.count };
  });
}
