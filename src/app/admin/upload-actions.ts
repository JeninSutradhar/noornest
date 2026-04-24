"use server";

import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { isAdminAuthenticated } from "@/lib/admin-session";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

async function saveAdminImageUpload(formData: FormData, subfolder: "products" | "categories"): Promise<{ url: string }> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file uploaded");
  }
  if (file.size === 0) {
    throw new Error("Empty file");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    throw new Error("Use JPG, PNG, WebP, or GIF");
  }

  const ext =
    mime === "image/jpeg" ? ".jpg" : mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".gif";

  const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  return { url: `/uploads/${subfolder}/${name}` };
}

export async function uploadAdminProductImageAction(formData: FormData): Promise<{ url: string }> {
  return saveAdminImageUpload(formData, "products");
}

export async function uploadAdminCategoryImageAction(formData: FormData): Promise<{ url: string }> {
  return saveAdminImageUpload(formData, "categories");
}
