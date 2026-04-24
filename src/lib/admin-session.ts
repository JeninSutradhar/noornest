import { cookies } from "next/headers";

const ADMIN_COOKIE = "noornest_admin_key";

export async function getAdminKeyFromCookie() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value || null;
}

export async function isAdminAuthenticated() {
  const key = await getAdminKeyFromCookie();
  const expected = process.env.ADMIN_API_KEY;
  return Boolean(key && expected && key === expected);
}

export async function setAdminCookie(apiKey: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, apiKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
