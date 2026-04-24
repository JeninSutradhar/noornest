import { withApiHandler } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  return withApiHandler(async () => {
    await clearAuthCookie();
    return { loggedOut: true };
  });
}
