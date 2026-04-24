"use client";

import { useMemo, useState } from "react";

import { createCategoryAction, deleteCategoryAction } from "@/app/admin/resource-actions";
import { uploadAdminCategoryImageAction } from "@/app/admin/upload-actions";
import { AdminImageUploadSlot } from "@/components/admin/image-upload-slot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl?: string | null;
};

function sortedCategoryOptions(categories: CategoryRow[]) {
  const list = [...categories];
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const c of list) {
    const k = c.parentId;
    const arr = byParent.get(k) ?? [];
    arr.push(c);
    byParent.set(k, arr);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }
  const out: CategoryRow[] = [];
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
}

const labelCls = "mb-1.5 block text-xs font-medium text-slate-600";

export function CategoryCreateForm({ categories }: { categories: CategoryRow[] }) {
  const [imageUrl, setImageUrl] = useState("");
  const options = useMemo(() => sortedCategoryOptions(categories), [categories]);

  return (
    <form action={createCategoryAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Name</label>
          <Input name="name" placeholder="e.g. Ramadan essentials" required />
        </div>
        <div>
          <label className={labelCls}>Slug (optional)</label>
          <Input name="slug" placeholder="auto-generated from name if empty" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-md border border-[#0A4D3C]/20 px-3 py-2 text-sm"
          placeholder="Shown on the storefront category page when configured"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className={labelCls}>Category image</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://… or upload"
              className="min-w-0 flex-1"
            />
            <AdminImageUploadSlot
              uploadAction={uploadAdminCategoryImageAction}
              onUploaded={setImageUrl}
              label="Upload image"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Files are saved under /uploads/categories on this server.</p>
        </div>
        <div>
          <label className={labelCls}>Sort order</label>
          <Input name="sortOrder" type="number" defaultValue={0} />
        </div>
        <div className="lg:col-span-3">
          <label className={labelCls}>Parent category</label>
          <select
            name="parentId"
            defaultValue=""
            className="h-10 w-full max-w-md rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
          >
            <option value="">None — top-level category</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `↳ ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="featured" className="h-4 w-4 rounded border-[#0A4D3C]/30" />
          Featured
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 rounded border-[#0A4D3C]/30"
          />
          Active
        </label>
        <Button type="submit" className="ml-auto">
          Create category
        </Button>
      </div>
    </form>
  );
}

export function CategoryDeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCategoryAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Delete this category? Subcategories must be removed first.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={cn(
          "rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700",
          "shadow-sm transition hover:bg-red-50",
        )}
      >
        Delete
      </button>
    </form>
  );
}
