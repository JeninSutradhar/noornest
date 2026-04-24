import bcrypt from "bcryptjs";
import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) throw new ApiError(401, "Invalid credentials");
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid credentials");
    if (!user.isActive) throw new ApiError(403, "Account is inactive");

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAuthToken({ userId: user.id, role: user.role });
    await setAuthCookie(token);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  });
}
