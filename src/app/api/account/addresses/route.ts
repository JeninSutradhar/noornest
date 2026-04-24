import { z } from "zod";

import { withApiHandler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.enum(["HOME", "OFFICE", "OTHER"]).default("HOME"),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().nullable(),
  line1: z.string().min(2),
  line2: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default("India"),
  postalCode: z.string().min(4),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.address.create({
      data: {
        userId: user.id,
        ...body,
      },
    });
  });
}
