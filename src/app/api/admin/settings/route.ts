import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const upsertSchema = z.object({
  groupKey: z.enum(["payment", "shipping", "tax", "seo"]),
  entries: z.array(
    z.object({
      key: z.string().min(1),
      valueType: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "SECRET"]),
      valueJson: z.unknown(),
      isEncrypted: z.boolean().default(false),
    }),
  ),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const groupKey = searchParams.get("groupKey");
    return prisma.adminSetting.findMany({
      where: groupKey ? { groupKey } : undefined,
      orderBy: [{ groupKey: "asc" }, { key: "asc" }],
    });
  });
}

export async function PUT(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = upsertSchema.parse(await request.json());

    const operations = body.entries.map((entry) =>
      prisma.adminSetting.upsert({
        where: {
          groupKey_key: {
            groupKey: body.groupKey,
            key: entry.key,
          },
        },
        update: {
          valueType: entry.valueType,
          valueJson: entry.valueJson as Prisma.InputJsonValue,
          isEncrypted: entry.isEncrypted,
        },
        create: {
          groupKey: body.groupKey,
          key: entry.key,
          valueType: entry.valueType,
          valueJson: entry.valueJson as Prisma.InputJsonValue,
          isEncrypted: entry.isEncrypted,
        },
      }),
    );

    const data = await prisma.$transaction(operations);
    return { updated: data.length, entries: data };
  });
}
