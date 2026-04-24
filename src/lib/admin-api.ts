import { headers } from "next/headers";

import { getAdminKeyFromCookie } from "@/lib/admin-session";

type ApiResult<T> = {
  success: boolean;
  data: T;
  error?: { message?: string };
};

/**
 * Server-side helper for admin pages to call their own API routes.
 * Automatically detects the correct host/port from the incoming request headers
 * so it works on any port (dev, staging, production).
 */
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const [apiKey, headerStore] = await Promise.all([
    getAdminKeyFromCookie(),
    headers(),
  ]);

  // Prefer explicit env var, then derive from the incoming Host header
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL;
  const host = headerStore.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const base = configuredBase || `${proto}://${host}`;

  const response = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-admin-api-key": apiKey || "",
      ...(init?.headers || {}),
    },
  });

  // Guard against HTML error pages (redirects, 404s, etc.)
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Admin API returned non-JSON response (${response.status}): ${text.slice(0, 120)}`,
    );
  }

  const json = (await response.json()) as ApiResult<T>;
  if (!response.ok || !json.success) {
    throw new Error(json?.error?.message || "Admin API request failed");
  }
  return json.data;
}
