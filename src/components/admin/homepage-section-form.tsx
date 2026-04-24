"use client";

import { useMemo, useState } from "react";

import { createSectionAction } from "@/app/admin/resource-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomepageSectionForm({
  products,
}: {
  products: Array<{ id: string; title: string }>;
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 80);
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 80);
  }, [products, query]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form action={createSectionAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Input name="title" placeholder="Section title" required />
      <Input name="subtitle" placeholder="Section subtitle" />
      <Input name="slug" placeholder="URL slug (optional)" />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Section type</label>
        <select
          name="type"
          defaultValue="CUSTOM"
          className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
        >
          <option value="CUSTOM">Custom (hand-picked products)</option>
          <option value="NEW_ARRIVALS">New arrivals</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Products to show on storefront</label>
        <select
          name="productsToShow"
          defaultValue="4"
          className="h-10 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
        >
          <option value="4">4</option>
          <option value="6">6</option>
          <option value="8">8</option>
        </select>
      </div>
      <Input name="sortOrder" type="number" defaultValue={0} placeholder="Sort order" />
      <label className="flex items-center gap-2 text-sm md:col-span-1">
        <input type="checkbox" name="isDefault" />
        Default section
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-1">
        <input type="checkbox" name="isActive" defaultChecked />
        Active
      </label>

      <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-[#0A4D3C]/10 bg-white/60 p-4">
        <p className="mb-2 text-sm font-medium text-[#0A4D3C]">Products in this section</p>
        <p className="mb-3 text-xs text-slate-500">
          Search by name and tick products. No need to paste internal IDs — we store those for you.
        </p>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="mb-3"
        />
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[#0A4D3C]/10 p-2">
          {filtered.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#0A4D3C]/5">
              <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="text-slate-800">{p.title}</span>
            </label>
          ))}
        </div>
        {selectedIds.length > 0 && (
          <p className="mt-2 text-xs text-slate-600">
            {selectedIds.length} product{selectedIds.length === 1 ? "" : "s"} selected
          </p>
        )}
      </div>

      <input type="hidden" name="productIds" value={selectedIds.join(",")} readOnly />
      <div className="md:col-span-full">
        <Button type="submit">Create section</Button>
      </div>
    </form>
  );
}
