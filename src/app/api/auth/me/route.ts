import { withApiHandler } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  return withApiHandler(async () => {
    const user = await getCurrentUser();
    return { user };
  });
}
