"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { adminApi } from "@/lib/admin-api";
import { clearAdminCookie, setAdminCookie } from "@/lib/admin-session";

export async function adminLoginAction(formData: FormData) {
  const apiKey = String(formData.get("apiKey") || "");
  if (!apiKey) {
    redirect("/admin/login?error=Missing+API+key");
  }
  if (apiKey !== process.env.ADMIN_API_KEY) {
    redirect("/admin/login?error=Invalid+API+key");
  }
  await setAdminCookie(apiKey);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminCookie();
  redirect("/admin/login");
}

export async function adminDeleteAction(path: string, revalidateTo: string) {
  await adminApi(path, { method: "DELETE" });
  revalidatePath(revalidateTo);
}
