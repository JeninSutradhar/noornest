"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { upsertProductAction } from "@/app/admin/resource-actions";
import { uploadAdminProductImageAction } from "@/app/admin/upload-actions";
import { AdminImageUploadSlot } from "@/components/admin/image-upload-slot";
import { productInputSchema } from "@/server/validators/admin";
import type { ZodIssue } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; name: string; parentId: string | null };

type FormValues = {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  regularPrice: number;
  salePrice: string;
  sku: string;
  stockQuantity: number;
  weightKg: number;
  dimensionLengthCm: number;
  dimensionWidthCm: number;
  dimensionHeightCm: number;
  variantType: string;
  tagsLine: string;
  featured: boolean;
  status: "ACTIVE" | "DRAFT" | "INACTIVE";
  metaTitle: string;
  metaDescription: string;
  islamicComplianceNote: string;
  categoryIds: string[];
  images: Array<{ imageUrl: string; altText: string; sortOrder: number; isFeatured: boolean }>;
  attributeRows: Array<{ key: string; value: string }>;
  variants: Array<{
    name: string;
    sku: string;
    value: string;
    option1: string;
    option2: string;
    option3: string;
    regularPrice: number;
    salePrice: string;
    stockQuantity: number;
    weightKg: string;
    imageUrl: string;
    isActive: boolean;
  }>;
};

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function defaultsFromProduct(product?: Record<string, unknown>): FormValues {
  if (!product) {
    return {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      regularPrice: 0,
      salePrice: "",
      sku: "",
      stockQuantity: 0,
      weightKg: 0,
      dimensionLengthCm: 0,
      dimensionWidthCm: 0,
      dimensionHeightCm: 0,
      variantType: "",
      tagsLine: "",
      featured: false,
      status: "DRAFT",
      metaTitle: "",
      metaDescription: "",
      islamicComplianceNote: "",
      categoryIds: [],
      images: [{ imageUrl: "", altText: "", sortOrder: 0, isFeatured: true }],
      attributeRows: [{ key: "", value: "" }],
      variants: [],
    };
  }

  const categories = (product.categories as Array<{ categoryId: string }>) || [];
  const imagesRaw = (product.images as Array<Record<string, unknown>>) || [];
  const variantsRaw = (product.variants as Array<Record<string, unknown>>) || [];
  const tags = Array.isArray(product.tagsJson) ? (product.tagsJson as string[]) : [];
  const attrs =
    product.attributesJson && typeof product.attributesJson === "object"
      ? Object.entries(product.attributesJson as Record<string, unknown>).map(([key, value]) => ({
          key,
          value: String(value ?? ""),
        }))
      : [{ key: "", value: "" }];

  const images =
    imagesRaw.length > 0
      ? imagesRaw.map((img, i) => ({
          imageUrl: String(img.imageUrl || ""),
          altText: String(img.altText ?? ""),
          sortOrder: num(img.sortOrder, i),
          isFeatured: Boolean(img.isFeatured),
        }))
      : [{ imageUrl: "", altText: "", sortOrder: 0, isFeatured: true }];

  return {
    title: String(product.title || ""),
    slug: String(product.slug || ""),
    description: String(product.description || ""),
    shortDescription: String(product.shortDescription ?? ""),
    regularPrice: num(product.regularPrice),
    salePrice: product.salePrice != null && String(product.salePrice) !== "" ? String(product.salePrice) : "",
    sku: String(product.sku || ""),
    stockQuantity: num(product.stockQuantity),
    weightKg: num(product.weightKg),
    dimensionLengthCm: num(product.dimensionLengthCm),
    dimensionWidthCm: num(product.dimensionWidthCm),
    dimensionHeightCm: num(product.dimensionHeightCm),
    variantType: String(product.variantType ?? ""),
    tagsLine: tags.join(", "),
    featured: Boolean(product.featured),
    status: (product.status as FormValues["status"]) || "DRAFT",
    metaTitle: String(product.metaTitle ?? ""),
    metaDescription: String(product.metaDescription ?? ""),
    islamicComplianceNote: String(product.islamicComplianceNote ?? ""),
    categoryIds: categories.map((c) => c.categoryId),
    images,
    attributeRows: attrs.length ? attrs : [{ key: "", value: "" }],
    variants: variantsRaw.map((v) => ({
      name: String(v.name || ""),
      sku: String(v.sku || ""),
      value: String(v.value || ""),
      option1: String(v.option1 ?? ""),
      option2: String(v.option2 ?? ""),
      option3: String(v.option3 ?? ""),
      regularPrice: num(v.regularPrice),
      salePrice: v.salePrice != null && String(v.salePrice) !== "" ? String(v.salePrice) : "",
      stockQuantity: num(v.stockQuantity),
      weightKg: v.weightKg != null && String(v.weightKg) !== "" ? String(v.weightKg) : "",
      imageUrl: String(v.imageUrl ?? ""),
      isActive: v.isActive !== false,
    })),
  };
}

function buildApiPayload(v: FormValues) {
  const attributesJson = Object.fromEntries(
    v.attributeRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
  );
  const tagsJson = v.tagsLine
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const variantType =
    v.variantType && ["SIZE", "COLOR", "DESIGN", "MATERIAL", "STYLE", "CUSTOM"].includes(v.variantType)
      ? (v.variantType as "SIZE" | "COLOR" | "DESIGN" | "MATERIAL" | "STYLE" | "CUSTOM")
      : null;

  const images = v.images
    .filter((img) => img.imageUrl.trim())
    .map((img, i) => ({
      imageUrl: img.imageUrl.trim(),
      altText: img.altText.trim() || null,
      sortOrder: img.sortOrder ?? i,
      isFeatured: Boolean(img.isFeatured),
    }));

  const variants = v.variants
    .filter((row) => row.sku.trim() && row.name.trim() && row.value.trim())
    .map((row) => ({
      name: row.name.trim(),
      sku: row.sku.trim(),
      value: row.value.trim(),
      option1: row.option1.trim() || undefined,
      option2: row.option2.trim() || undefined,
      option3: row.option3.trim() || undefined,
      regularPrice: num(row.regularPrice),
      salePrice: row.salePrice.trim() ? num(row.salePrice) : null,
      stockQuantity: num(row.stockQuantity),
      weightKg: row.weightKg.trim() ? num(row.weightKg) : null,
      imageUrl: row.imageUrl.trim() || null,
      isActive: row.isActive,
    }));

  return {
    title: v.title.trim(),
    slug: v.slug.trim() || undefined,
    description: v.description.trim(),
    shortDescription: v.shortDescription.trim() || null,
    regularPrice: num(v.regularPrice),
    salePrice: v.salePrice.trim() ? num(v.salePrice) : null,
    sku: v.sku.trim(),
    stockQuantity: num(v.stockQuantity),
    weightKg: num(v.weightKg),
    dimensionLengthCm: num(v.dimensionLengthCm),
    dimensionWidthCm: num(v.dimensionWidthCm),
    dimensionHeightCm: num(v.dimensionHeightCm),
    variantType,
    attributesJson: Object.keys(attributesJson).length ? attributesJson : null,
    tagsJson: tagsJson.length ? tagsJson : null,
    featured: v.featured,
    status: v.status,
    metaTitle: v.metaTitle.trim() || null,
    metaDescription: v.metaDescription.trim() || null,
    islamicComplianceNote: v.islamicComplianceNote.trim() || null,
    categoryIds: v.categoryIds,
    images,
    variants,
  };
}

function formatProductValidationIssues(issues: ZodIssue[]): string {
  return issues
    .map((i) => {
      const path = i.path.join(".");
      const img = path.match(/^images\.(\d+)\.(\w+)$/);
      if (img && img[2] === "imageUrl") {
        return `Image ${Number(img[1]) + 1}: ${i.message}`;
      }
      const vImg = path.match(/^variants\.(\d+)\.imageUrl$/);
      if (vImg) {
        return `Variant ${Number(vImg[1]) + 1} photo: ${i.message}`;
      }
      if (!path) return i.message;
      return `${path.replace(/^body\./, "")}: ${i.message}`;
    })
    .join(" · ");
}

const sectionTitle = "text-sm font-semibold text-[#0A4D3C]";
const fieldLabel = "mb-1 block text-xs font-medium text-slate-600";

const VARIANT_GROUP_LABELS: Record<string, string> = {
  SIZE: "Size",
  COLOR: "Color",
  DESIGN: "Design",
  MATERIAL: "Material",
  STYLE: "Style",
  CUSTOM: "Variant",
};

const VARIANT_VALUE_PLACEHOLDER: Record<string, string> = {
  SIZE: "e.g. Large, M, 42",
  COLOR: "e.g. Navy, Olive green",
  DESIGN: "e.g. Floral border",
  MATERIAL: "e.g. Cotton, Oak frame",
  STYLE: "e.g. Minimal, Traditional",
  CUSTOM: "Customer-facing label",
};

function variantTypeLabel(code: string) {
  return VARIANT_GROUP_LABELS[code] ?? "option";
}

export function ProductEditor({
  product,
  categories,
}: {
  product?: Record<string, unknown>;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const productId = product?.id as string | undefined;
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: defaultsFromProduct(product),
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control: form.control, name: "images" });
  const {
    fields: attrFields,
    append: appendAttr,
    remove: removeAttr,
  } = useFieldArray({ control: form.control, name: "attributeRows" });
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control: form.control, name: "variants" });

  const categoryIds = form.watch("categoryIds");
  const variantType = form.watch("variantType");
  const imagesWatched = form.watch("images");
  const variantsWatched = form.watch("variants");

  const sortedCategories = useMemo(() => {
    const list = [...categories];
    const byParent = new Map<string | null, CategoryOption[]>();
    for (const c of list) {
      const k = c.parentId;
      const arr = byParent.get(k) ?? [];
      arr.push(c);
      byParent.set(k, arr);
    }
    for (const arr of byParent.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    const out: CategoryOption[] = [];
    const roots = byParent.get(null) ?? [];
    for (const r of roots) {
      out.push(r);
      out.push(...(byParent.get(r.id) ?? []));
    }
    const seen = new Set(out.map((c) => c.id));
    for (const c of list) {
      if (!seen.has(c.id)) out.push(c);
    }
    return out;
  }, [categories]);

  const variantValuePlaceholder = variantType
    ? VARIANT_VALUE_PLACEHOLDER[variantType] ?? "Shown to customers at checkout"
    : "e.g. Large, Navy";
  const variantValueLabel = variantType ? `${variantTypeLabel(variantType)} value` : "Option value";

  const needsVariantTypeBeforeRows = !variantType && variantFields.length === 0;

  function toggleCategory(id: string, checked: boolean) {
    const next = new Set(form.getValues("categoryIds"));
    if (checked) next.add(id);
    else next.delete(id);
    form.setValue("categoryIds", [...next]);
  }

  function onSubmit(values: FormValues) {
    setError("");
    const raw = buildApiPayload(values);
    const parsed = productInputSchema.safeParse(raw);
    if (!parsed.success) {
      setError(formatProductValidationIssues(parsed.error.issues));
      return;
    }
    startTransition(async () => {
      try {
        const { id } = await upsertProductAction(productId ?? null, parsed.data);
        if (!productId) {
          router.push(`/admin/products/${id}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4">
        <h3 className={sectionTitle}>Basics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={fieldLabel}>Title</label>
            <Input {...form.register("title", { required: true })} placeholder="Product title" />
          </div>
          <div>
            <label className={fieldLabel}>Slug (optional — auto from title if empty)</label>
            <Input {...form.register("slug")} placeholder="custom-slug" />
          </div>
          <div>
            <label className={fieldLabel}>SKU</label>
            <Input {...form.register("sku", { required: true })} placeholder="NN-…" />
          </div>
          <div>
            <label className={fieldLabel}>Status</label>
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Variant type</label>
            <select {...form.register("variantType")} className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm">
              <option value="">None — single SKU only</option>
              <option value="SIZE">Size</option>
              <option value="COLOR">Color</option>
              <option value="DESIGN">Design</option>
              <option value="MATERIAL">Material</option>
              <option value="STYLE">Style</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              When set, each variant row is one sellable option; the storefront uses this to label the choice (e.g. pick a size).
            </p>
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
            <input type="checkbox" {...form.register("featured")} />
            Featured on storefront
          </label>
        </div>
        <div>
          <label className={fieldLabel}>Short description</label>
          <textarea
            {...form.register("shortDescription")}
            rows={2}
            className="w-full rounded-md border border-[#0A4D3C]/20 px-3 py-2 text-sm"
            placeholder="Card / listing summary"
          />
        </div>
        <div>
          <label className={fieldLabel}>Full description</label>
          <textarea
            {...form.register("description", { required: true })}
            rows={6}
            className="w-full rounded-md border border-[#0A4D3C]/20 px-3 py-2 text-sm"
            placeholder="Full product story"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitle}>Pricing & inventory</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={fieldLabel}>Regular price (INR)</label>
            <Input type="number" step="0.01" {...form.register("regularPrice", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={fieldLabel}>Sale price (optional)</label>
            <Input type="number" step="0.01" {...form.register("salePrice")} />
          </div>
          <div>
            <label className={fieldLabel}>Stock quantity</label>
            <Input type="number" {...form.register("stockQuantity", { valueAsNumber: true })} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitle}>Shipping dimensions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className={fieldLabel}>Weight (kg)</label>
            <Input type="number" step="0.001" {...form.register("weightKg", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={fieldLabel}>Length (cm)</label>
            <Input type="number" step="0.01" {...form.register("dimensionLengthCm", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={fieldLabel}>Width (cm)</label>
            <Input type="number" step="0.01" {...form.register("dimensionWidthCm", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={fieldLabel}>Height (cm)</label>
            <Input type="number" step="0.01" {...form.register("dimensionHeightCm", { valueAsNumber: true })} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitle}>Categories</h3>
        <p className="text-xs text-slate-500">Choose where this product appears in the catalog. Subcategories are nested under their parent.</p>
        <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-xl border border-[#0A4D3C]/12 bg-white/95 p-2 shadow-sm">
          {sortedCategories.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No categories yet. Add some under Categories in the sidebar.</p>
          ) : (
            sortedCategories.map((cat) => {
              const checked = categoryIds.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    checked ? "bg-[#0A4D3C]/12 text-[#0A4D3C]" : "text-slate-700 hover:bg-[#0A4D3C]/6",
                    cat.parentId && "ml-3 border-l-2 border-[#C9A227]/45 pl-4",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-[#0A4D3C]/30 text-[#0A4D3C] focus:ring-[#0A4D3C]"
                    checked={checked}
                    onChange={(e) => toggleCategory(cat.id, e.target.checked)}
                  />
                  <span className={cn(!cat.parentId && "font-medium")}>{cat.name}</span>
                </label>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitle}>Tags</h3>
        <div>
          <label className={fieldLabel}>Comma-separated tags</label>
          <Input {...form.register("tagsLine")} placeholder="Ramadan Special, Gift, Home Decor" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className={sectionTitle}>Attributes (material, color, …)</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => appendAttr({ key: "", value: "" })}>
            Add row
          </Button>
        </div>
        <div className="space-y-2">
          {attrFields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <label className={fieldLabel}>Name</label>
                <Input {...form.register(`attributeRows.${index}.key`)} placeholder="material" />
              </div>
              <div className="min-w-[140px] flex-1">
                <label className={fieldLabel}>Value</label>
                <Input {...form.register(`attributeRows.${index}.value`)} placeholder="Velvet" />
              </div>
              <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeAttr(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className={sectionTitle}>Images</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendImage({ imageUrl: "", altText: "", sortOrder: imageFields.length, isFeatured: false })
            }
          >
            Add image
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Upload files (saved on this server under <code className="rounded bg-slate-100 px-1">/uploads/products</code>) or paste a CDN URL.
          Mark one image as featured for the main card.
        </p>
        <div className="space-y-3">
          {imageFields.map((field, index) => {
            const imgUrl = imagesWatched[index]?.imageUrl;
            return (
              <div key={field.id} className="rounded-lg border border-[#0A4D3C]/10 p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row">
                  {imgUrl?.trim() ? (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URLs */}
                      <img
                        src={imgUrl.trim()}
                        alt=""
                        className="h-24 w-24 rounded-lg border border-[#0A4D3C]/12 object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label className={fieldLabel}>Image URL</label>
                          <Input {...form.register(`images.${index}.imageUrl`)} placeholder="https://… or upload below" />
                        </div>
                        <AdminImageUploadSlot
                          uploadAction={uploadAdminProductImageAction}
                          disabled={pending}
                          onUploaded={(url) =>
                            form.setValue(`images.${index}.imageUrl`, url, { shouldDirty: true, shouldValidate: true })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className={fieldLabel}>Alt text</label>
                      <Input {...form.register(`images.${index}.altText`)} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Sort order</label>
                      <Input type="number" {...form.register(`images.${index}.sortOrder`, { valueAsNumber: true })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <input type="checkbox" {...form.register(`images.${index}.isFeatured`)} />
                      Featured (hero) image
                    </label>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-3 text-red-600" onClick={() => removeImage(index)}>
                  Remove image
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className={sectionTitle}>Variants</h3>
            {needsVariantTypeBeforeRows ? (
              <p className="mt-1 max-w-2xl text-xs text-slate-600">
                Pick a <strong>variant type</strong> under Basics first, then add rows — each row is one option customers can buy (different SKU/stock/price).
              </p>
            ) : variantType ? (
              <p className="mt-1 max-w-2xl text-xs text-slate-600">
                Shoppers choose a <strong>{variantTypeLabel(variantType).toLowerCase()}</strong>. The <em>{variantValueLabel.toLowerCase()}</em> is what they see (e.g. “Large”, “Navy”).
              </p>
            ) : variantFields.length > 0 ? (
              <p className="mt-1 max-w-2xl text-xs text-amber-800">
                You have variant rows but no variant type — set one under Basics so the storefront can label the selector correctly.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={needsVariantTypeBeforeRows || pending}
            title={needsVariantTypeBeforeRows ? "Choose a variant type in Basics first" : undefined}
            onClick={() => {
              const vt = form.getValues("variantType");
              const defaultName = (vt && VARIANT_GROUP_LABELS[vt]) || "Variant";
              appendVariant({
                name: defaultName,
                sku: "",
                value: "",
                option1: "",
                option2: "",
                option3: "",
                regularPrice: 0,
                salePrice: "",
                stockQuantity: 0,
                weightKg: "",
                imageUrl: "",
                isActive: true,
              });
            }}
          >
            Add variant
          </Button>
        </div>
        <div className="space-y-4">
          {variantFields.map((field, index) => {
            const vImg = variantsWatched[index]?.imageUrl;
            return (
            <div key={field.id} className="rounded-xl border border-[#0A4D3C]/10 p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={fieldLabel}>Group label</label>
                  <Input
                    {...form.register(`variants.${index}.name`)}
                    placeholder={variantType ? VARIANT_GROUP_LABELS[variantType] ?? "Variant" : "e.g. Size"}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Variant SKU</label>
                  <Input {...form.register(`variants.${index}.sku`)} />
                </div>
                <div>
                  <label className={fieldLabel}>{variantValueLabel}</label>
                  <Input {...form.register(`variants.${index}.value`)} placeholder={variantValuePlaceholder} />
                </div>
                <div>
                  <label className={fieldLabel}>Regular price</label>
                  <Input type="number" step="0.01" {...form.register(`variants.${index}.regularPrice`, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className={fieldLabel}>Sale price</label>
                  <Input type="number" step="0.01" {...form.register(`variants.${index}.salePrice`)} />
                </div>
                <div>
                  <label className={fieldLabel}>Stock</label>
                  <Input type="number" {...form.register(`variants.${index}.stockQuantity`, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className={fieldLabel}>Weight kg (optional)</label>
                  <Input {...form.register(`variants.${index}.weightKg`)} />
                </div>
                <div className="md:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className={fieldLabel}>Variant image URL</label>
                      <Input {...form.register(`variants.${index}.imageUrl`)} placeholder="https://… or upload" />
                    </div>
                    <AdminImageUploadSlot
                      uploadAction={uploadAdminProductImageAction}
                      disabled={pending}
                      onUploaded={(url) =>
                        form.setValue(`variants.${index}.imageUrl`, url, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                  </div>
                  {vImg?.trim() ? (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vImg.trim()}
                        alt=""
                        className="h-16 w-16 rounded-md border border-[#0A4D3C]/10 object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register(`variants.${index}.isActive`)} />
                  Active
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">Optional: option1–3 for extra labels.</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Input {...form.register(`variants.${index}.option1`)} placeholder="option1" />
                <Input {...form.register(`variants.${index}.option2`)} placeholder="option2" />
                <Input {...form.register(`variants.${index}.option3`)} placeholder="option3" />
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-2 text-red-600" onClick={() => removeVariant(index)}>
                Remove variant
              </Button>
            </div>
          );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitle}>SEO & compliance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={fieldLabel}>Meta title</label>
            <Input {...form.register("metaTitle")} />
          </div>
          <div>
            <label className={fieldLabel}>Meta description</label>
            <Input {...form.register("metaDescription")} />
          </div>
        </div>
        <div>
          <label className={fieldLabel}>Islamic compliance note</label>
          <textarea
            {...form.register("islamicComplianceNote")}
            rows={2}
            className="w-full rounded-md border border-[#0A4D3C]/20 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <Button type="submit" disabled={pending} className="min-w-[160px]">
        {pending ? "Saving…" : productId ? "Update product" : "Create product"}
      </Button>
    </form>
  );
}
