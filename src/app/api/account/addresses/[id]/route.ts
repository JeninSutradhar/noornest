import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  type: z.enum(["HOME", "OFFICE", "OTHER"]).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable(),
  line1: z.string().min(2).optional(),
  line2: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().optional(),
  postalCode: z.string().min(4).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError(404, "Address not found");

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({ where: { id }, data: body });
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError(404, "Address not found");
    await prisma.address.delete({ where: { id } });
    return { id, deleted: true };
  });
}
