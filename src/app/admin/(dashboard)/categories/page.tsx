import { adminApi } from "@/lib/admin-api";
import { CategoryCreateForm, CategoryDeleteButton, type CategoryRow } from "@/components/admin/category-admin";

function pickThumb(url?: string | null) {
  const u = url?.trim();
  return u || null;
}

export default async function AdminCategoriesPage() {
  const categories = await adminApi<CategoryRow[]>("/api/admin/categories");
  const roots = categories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, CategoryRow[]>();
  categories.forEach((c) => {
    if (!c.parentId) return;
    const arr = childrenByParent.get(c.parentId) || [];
    arr.push(c);
    childrenByParent.set(c.parentId, arr);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Categories</h1>
        <p className="mt-1 text-sm text-slate-600">Organize products for the storefront. Subcategories nest under a parent.</p>
      </div>
      <section className="lux-card rounded-xl p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-[#0A4D3C]">Create category</h2>
        <p className="mb-6 text-sm text-slate-600">Use a parent only when this category should appear nested in the catalog.</p>
        <CategoryCreateForm categories={categories} />
      </section>
      <section className="lux-card rounded-xl p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0A4D3C]">Catalog tree</h2>
        <div className="space-y-4">
          {roots.length === 0 ? (
            <p className="text-sm text-slate-500">No categories yet. Create one above.</p>
          ) : (
            roots.map((root) => {
              const thumb = pickThumb(root.imageUrl);
              const children = childrenByParent.get(root.id) || [];
              return (
                <div
                  key={root.id}
                  className="rounded-xl border border-[#0A4D3C]/12 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      {thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={thumb}
                          alt=""
                          className="h-14 w-14 rounded-lg border border-[#0A4D3C]/12 object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-[#0A4D3C]/20 bg-slate-50 text-xs text-slate-400">
                          —
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#0A4D3C]">{root.name}</p>
                          <p className="text-xs text-slate-500">{root.slug}</p>
                        </div>
                        <CategoryDeleteButton id={root.id} />
                      </div>
                      {children.length > 0 ? (
                        <ul className="mt-4 space-y-2 border-l-2 border-[#C9A227]/45 pl-4">
                          {children.map((child) => {
                            const ct = pickThumb(child.imageUrl);
                            return (
                              <li
                                key={child.id}
                                className="flex items-center gap-3 rounded-lg bg-[#0A4D3C]/4 px-3 py-2"
                              >
                                {ct ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={ct}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-md border border-[#0A4D3C]/10 object-cover"
                                  />
                                ) : (
                                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-[#0A4D3C]/15 bg-white text-[10px] text-slate-400">
                                    —
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-800">{child.name}</p>
                                  <p className="text-xs text-slate-500">{child.slug}</p>
                                </div>
                                <CategoryDeleteButton id={child.id} />
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
