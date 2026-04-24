import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sectionIds: z.array(z.string()).min(1),
});

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = schema.parse(await request.json());
    await prisma.$transaction(
      body.sectionIds.map((id, index) =>
        prisma.homepageSection.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return { reordered: body.sectionIds.length };
  });
}
