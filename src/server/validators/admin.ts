import { z } from "zod";

/** Allows https URLs and same-origin paths (admin uploads return `/uploads/...`). */
function isProductImageUrl(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (s.startsWith("/")) {
    if (s.startsWith("//")) return false;
    if (/[\u0000-\u001f\u007f]/.test(s)) return false;
    return true;
  }
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const productImageUrlSchema = z
  .string()
  .min(1, "Image link is required")
  .refine(isProductImageUrl, {
    message: "Use a full https:// link or an uploaded path starting with /",
  });

/** Optional image URL for categories, hero slides, etc. */
export const optionalNullableAssetUrlSchema = z
  .union([z.literal(""), z.null(), z.undefined(), productImageUrlSchema])
  .transform((v) => (v === "" || v === undefined || v === null ? null : v));

const optionalVariantImageUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v === undefined || v === null || v === "" ? null : v))
  .pipe(z.union([z.null(), productImageUrlSchema]));

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().min(1),
  value: z.string().min(1),
  option1: z.string().optional(),
  option2: z.string().optional(),
  option3: z.string().optional(),
  regularPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative(),
  weightKg: z.number().nonnegative().optional().nullable(),
  imageUrl: optionalVariantImageUrlSchema,
  isActive: z.boolean().default(true),
});

export const productInputSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(2),
  shortDescription: z.string().optional().nullable(),
  regularPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional().nullable(),
  sku: z.string().min(1),
  stockQuantity: z.number().int().nonnegative(),
  weightKg: z.number().nonnegative(),
  dimensionLengthCm: z.number().nonnegative(),
  dimensionWidthCm: z.number().nonnegative(),
  dimensionHeightCm: z.number().nonnegative(),
  variantType: z
    .enum(["SIZE", "COLOR", "DESIGN", "MATERIAL", "STYLE", "CUSTOM"])
    .optional()
    .nullable(),
  attributesJson: z.record(z.string(), z.unknown()).optional().nullable(),
  tagsJson: z.array(z.string()).optional().nullable(),
  featured: z.boolean().default(false),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).default("DRAFT"),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  islamicComplianceNote: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        imageUrl: productImageUrlSchema,
        altText: z.string().optional().nullable(),
        sortOrder: z.number().int().default(0),
        isFeatured: z.boolean().default(false),
      }),
    )
    .default([]),
  variants: z.array(productVariantSchema).default([]),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: optionalNullableAssetUrlSchema,
  sortOrder: z.number().int().default(0),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
});

export const couponInputSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().nonnegative(),
  minimumCartValue: z.number().nonnegative().optional().nullable(),
  maxDiscountAmount: z.number().nonnegative().optional().nullable(),
  startDate: z.string(),
  expiryDate: z.string(),
  usageLimitPerUser: z.number().int().positive().optional().nullable(),
  usageLimitTotal: z.number().int().positive().optional().nullable(),
  scope: z.enum(["ALL", "PRODUCTS", "CATEGORIES"]).default("ALL"),
  status: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export const heroSlideInputSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
  desktopImageUrl: z.string().url(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const homepageSectionInputSchema = z.object({
  type: z.enum(["NEW_ARRIVALS", "CUSTOM"]),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  slug: z.string().optional(),
  productsToShow: z.union([z.literal(4), z.literal(6), z.literal(8)]),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
});
