import {
  createHeroSlideAction,
  deleteHeroSlideAction,
  deleteSectionAction,
} from "@/app/admin/resource-actions";
import { adminApi } from "@/lib/admin-api";
import { HomepageSectionForm } from "@/components/admin/homepage-section-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminHomepageManagerPage() {
  const [slides, sections, catalog] = await Promise.all([
    adminApi<Array<{ id: string; title: string; sortOrder: number }>>("/api/admin/homepage/hero-slides"),
    adminApi<
      Array<{ id: string; title: string; type: string; sortOrder: number; products: Array<{ productId: string }> }>
    >("/api/admin/homepage/sections"),
    adminApi<{ items: Array<{ id: string; title: string }> }>("/api/admin/products?pageSize=200"),
  ]);

  const titleById = new Map(catalog.items.map((p) => [p.id, p.title] as const));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#0A4D3C]">Homepage</h1>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#0A4D3C]">Hero slider</h2>
        <form action={createHeroSlideAction} className="grid gap-3 md:grid-cols-3">
          <Input name="title" placeholder="Title" required />
          <Input name="subtitle" placeholder="Subtitle" />
          <Input name="desktopImageUrl" placeholder="Desktop image URL" required />
          <Input name="buttonText" placeholder="Button text" />
          <Input name="buttonLink" placeholder="Button link" />
          <Input name="sortOrder" type="number" defaultValue={0} placeholder="Sort order" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked /> Active
          </label>
          <Button type="submit">Add slide</Button>
        </form>
        <div className="mt-4 space-y-2">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex items-center justify-between rounded-md border border-[#0A4D3C]/10 p-3 text-sm"
            >
              <span>
                {slide.sortOrder}. {slide.title}
              </span>
              <form action={deleteHeroSlideAction}>
                <input type="hidden" name="id" value={slide.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="lux-card rounded-xl p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-[#0A4D3C]">Homepage sections</h2>
        <p className="mb-4 text-sm text-slate-600">
          Build curated rows for the storefront. Pick products by name instead of pasting database IDs.
        </p>
        <HomepageSectionForm products={catalog.items} />
        <div className="mt-6 space-y-2">
          {sections.map((section) => (
            <div key={section.id} className="rounded-md border border-[#0A4D3C]/10 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-800">
                  {section.sortOrder}. {section.title}{" "}
                  <span className="font-normal text-slate-500">({section.type})</span>
                </span>
                <form action={deleteSectionAction}>
                  <input type="hidden" name="id" value={section.id} />
                  <button type="submit" className="text-red-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Products: </span>
                {section.products.length === 0
                  ? "—"
                  : section.products
                      .map((p) => titleById.get(p.productId) || "Unknown product")
                      .join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
