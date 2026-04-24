import { z } from "zod";

import { withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
});

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  });
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    return prisma.user.update({
      where: { id: user.id },
      data: body,
      select: { id: true, name: true, email: true, phone: true },
    });
  });
}
