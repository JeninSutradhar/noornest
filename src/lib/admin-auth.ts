import { headers } from "next/headers";

import { ApiError } from "@/lib/api";

export async function requireAdmin() {
  const headerStore = await headers();
  const incomingKey = headerStore.get("x-admin-api-key");
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey) {
    throw new ApiError(
      500,
      "ADMIN_API_KEY is not configured. Set it in environment variables.",
    );
  }

  if (!incomingKey || incomingKey !== configuredKey) {
    throw new ApiError(401, "Unauthorized admin request");
  }
}
