import { parse } from "csv-parse/sync";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

const rowSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  regularPrice: z.coerce.number().nonnegative(),
  sku: z.string().min(1),
  stockQuantity: z.coerce.number().int().nonnegative(),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = (await request.json()) as { csv: string };
    const records = parse(body.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const parsedRows = records.map((record) => rowSchema.parse(record));

    const created: string[] = [];
    const failed: Array<{ sku: string; reason: string }> = [];

    for (const row of parsedRows) {
      const slug = toSlug(row.title);
      const existing = await prisma.product.findFirst({
        where: { OR: [{ sku: row.sku }, { slug }] },
        select: { id: true },
      });
      if (existing) {
        failed.push({ sku: row.sku, reason: "Duplicate SKU or slug" });
        continue;
      }

      const product = await prisma.product.create({
        data: {
          title: row.title,
          slug,
          description: row.description,
          regularPrice: row.regularPrice,
          sku: row.sku,
          stockQuantity: row.stockQuantity,
          weightKg: 0,
          dimensionLengthCm: 0,
          dimensionWidthCm: 0,
          dimensionHeightCm: 0,
          status: "DRAFT",
        },
        select: { id: true },
      });
      created.push(product.id);
    }

    return { imported: created.length, failed };
  });
}
