import bcrypt from "bcryptjs";
import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email.toLowerCase() }, { phone: body.phone }],
      },
      select: { id: true },
    });
    if (exists) throw new ApiError(409, "Email or phone already registered");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash,
        role: "CUSTOMER",
      },
      select: { id: true, role: true, name: true, email: true, phone: true },
    });

    const token = signAuthToken({ userId: user.id, role: user.role });
    await setAuthCookie(token);
    return user;
  });
}
