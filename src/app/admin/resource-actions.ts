"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminApi } from "@/lib/admin-api";
import { productInputSchema } from "@/server/validators/admin";

function toNum(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: FormDataEntryValue | null) {
  return String(value || "") === "on" || String(value || "") === "true";
}

export async function createCategoryAction(formData: FormData) {
  await adminApi("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      slug: String(formData.get("slug") || "") || undefined,
      description: String(formData.get("description") || "") || null,
      imageUrl: String(formData.get("imageUrl") || "") || null,
      sortOrder: toNum(formData.get("sortOrder")),
      featured: toBool(formData.get("featured")),
      isActive: toBool(formData.get("isActive")),
      parentId: String(formData.get("parentId") || "") || null,
    }),
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await adminApi(`/api/admin/categories/${String(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/admin/categories");
}

export async function createCouponAction(formData: FormData) {
  await adminApi("/api/admin/coupons", {
    method: "POST",
    body: JSON.stringify({
      code: String(formData.get("code") || ""),
      type: String(formData.get("type") || "PERCENTAGE"),
      value: toNum(formData.get("value")),
      minimumCartValue: formData.get("minimumCartValue") ? toNum(formData.get("minimumCartValue")) : null,
      maxDiscountAmount: formData.get("maxDiscountAmount") ? toNum(formData.get("maxDiscountAmount")) : null,
      startDate: String(formData.get("startDate") || new Date().toISOString()),
      expiryDate: String(formData.get("expiryDate") || new Date().toISOString()),
      usageLimitPerUser: formData.get("usageLimitPerUser") ? toNum(formData.get("usageLimitPerUser")) : null,
      usageLimitTotal: formData.get("usageLimitTotal") ? toNum(formData.get("usageLimitTotal")) : null,
      scope: String(formData.get("scope") || "ALL"),
      status: toBool(formData.get("status")),
      productIds: [],
      categoryIds: [],
    }),
  });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await adminApi(`/api/admin/coupons/${String(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/admin/coupons");
}

const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
const paymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export async function patchOrderAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const orderStatus = orderStatusEnum.safeParse(formData.get("orderStatus"));
  const paymentStatus = paymentStatusEnum.safeParse(formData.get("paymentStatus"));
  await adminApi(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...(orderStatus.success ? { orderStatus: orderStatus.data } : {}),
      ...(paymentStatus.success ? { paymentStatus: paymentStatus.data } : {}),
      notes: String(formData.get("notes") || "").trim() || undefined,
    }),
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function patchReviewStatusAction(formData: FormData) {
  await adminApi("/api/admin/reviews", {
    method: "PATCH",
    body: JSON.stringify({
      reviewId: String(formData.get("reviewId")),
      status: String(formData.get("status")),
    }),
  });
  revalidatePath("/admin/reviews");
}

export async function createHeroSlideAction(formData: FormData) {
  await adminApi("/api/admin/homepage/hero-slides", {
    method: "POST",
    body: JSON.stringify({
      title: String(formData.get("title") || ""),
      subtitle: String(formData.get("subtitle") || "") || null,
      buttonText: String(formData.get("buttonText") || "") || null,
      buttonLink: String(formData.get("buttonLink") || "") || null,
      desktopImageUrl: String(formData.get("desktopImageUrl") || ""),
      sortOrder: toNum(formData.get("sortOrder")),
      isActive: toBool(formData.get("isActive")),
    }),
  });
  revalidatePath("/admin/homepage");
}

export async function deleteHeroSlideAction(formData: FormData) {
  await adminApi(`/api/admin/homepage/hero-slides/${String(formData.get("id"))}`, {
    method: "DELETE",
  });
  revalidatePath("/admin/homepage");
}

export async function createSectionAction(formData: FormData) {
  const productIds = String(formData.get("productIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await adminApi("/api/admin/homepage/sections", {
    method: "POST",
    body: JSON.stringify({
      type: String(formData.get("type") || "CUSTOM"),
      title: String(formData.get("title") || ""),
      subtitle: String(formData.get("subtitle") || "") || null,
      slug: String(formData.get("slug") || "") || undefined,
      productsToShow: toNum(formData.get("productsToShow"), 4),
      isDefault: toBool(formData.get("isDefault")),
      sortOrder: toNum(formData.get("sortOrder")),
      isActive: toBool(formData.get("isActive")),
      productIds,
    }),
  });
  revalidatePath("/admin/homepage");
}

export async function deleteSectionAction(formData: FormData) {
  await adminApi(`/api/admin/homepage/sections/${String(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/admin/homepage");
}

export async function deleteProductAction(formData: FormData) {
  await adminApi(`/api/admin/products/${String(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/admin/products");
}

export async function upsertProductAction(
  productId: string | null,
  raw: unknown,
): Promise<{ id: string }> {
  const data = productInputSchema.parse(raw);
  if (productId) {
    await adminApi(`/api/admin/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { id: productId };
  }
  const created = await adminApi<{ id: string }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/admin/products");
  return { id: created.id };
}

const adminSettingEntrySchema = z.object({
  key: z.string().min(1),
  valueType: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "SECRET"]),
  valueJson: z.unknown(),
  isEncrypted: z.boolean().default(false),
});

export async function saveSettingsGroupAction(groupKey: string, raw: unknown) {
  const entries = z.array(adminSettingEntrySchema).parse(raw);
  await adminApi("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify({ groupKey, entries }),
  });
  revalidatePath("/admin/settings");
}
