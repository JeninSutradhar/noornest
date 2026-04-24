import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { heroSlideInputSchema } from "@/server/validators/admin";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdmin();
    return prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    await requireAdmin();
    const body = heroSlideInputSchema.parse(await request.json());
    return prisma.heroSlide.create({ data: body });
  });
}
