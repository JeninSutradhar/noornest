import { prisma } from "@/lib/prisma";
import { getShopProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [products, categoryTree] = await Promise.all([
    getShopProducts({
      q: params.q,
      categorySlug: params.category,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sort: params.sort,
      featured: params.featured === "true",
      stock: params.stock === "out" ? "out" : params.stock === "in" ? "in" : undefined,
      material: params.material,
      color: params.color,
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const filterMaterials = Array.from(
    new Set(
      products
        .map((product) => {
          const attrs =
            product.attributesJson && typeof product.attributesJson === "object"
              ? (product.attributesJson as Record<string, unknown>)
              : {};
          return String(attrs.material || "").trim();
        })
        .filter(Boolean),
    ),
  ).slice(0, 8);

  const filterColors = Array.from(
    new Set(
      products
        .map((product) => {
          const attrs =
            product.attributesJson && typeof product.attributesJson === "object"
              ? (product.attributesJson as Record<string, unknown>)
              : {};
          return String(attrs.color || "").trim();
        })
        .filter(Boolean),
    ),
  ).slice(0, 8);

  const appliedFilters = [
    params.category ? `Category: ${params.category}` : null,
    params.material ? `Material: ${params.material}` : null,
    params.color ? `Color: ${params.color}` : null,
    params.featured === "true" ? "Featured only" : null,
    params.stock ? `Stock: ${params.stock}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <aside className="space-y-5 rounded-2xl border border-[#0A4D3C]/10 bg-white p-5 shadow-sm md:sticky md:top-24 md:h-fit">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0A4D3C]">Filters</h2>
          <a href="/shop" className="text-xs text-[#0A4D3C]/80 hover:text-[#0A4D3C]">
            Clear all
          </a>
        </div>
        <form className="space-y-4" action="/shop">
          <Input name="q" defaultValue={params.q} placeholder="Search products" />
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="minPrice"
              type="number"
              defaultValue={params.minPrice}
              placeholder="Min price"
            />
            <Input
              name="maxPrice"
              type="number"
              defaultValue={params.maxPrice}
              placeholder="Max price"
            />
          </div>
          <select
            name="sort"
            defaultValue={params.sort || ""}
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          >
            <option value="">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <select
            name="stock"
            defaultValue={params.stock || ""}
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          >
            <option value="">All stock</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={params.featured === "true"}
              className="h-4 w-4 accent-[#0A4D3C]"
            />
            Featured products
          </label>
          {filterMaterials.length > 0 && (
            <select
              name="material"
              defaultValue={params.material || ""}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
            >
              <option value="">All materials</option>
              {filterMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          )}
          {filterColors.length > 0 && (
            <select
              name="color"
              defaultValue={params.color || ""}
              className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
            >
              <option value="">All colors</option>
              {filterColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" className="w-full">
            Apply Filters
          </Button>
        </form>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#0A4D3C]">Category Tree</h3>
          <div className="space-y-1 text-sm">
            {categoryTree.map((category) => (
              <div key={category.id}>
                <a
                  href={`/shop?category=${category.slug}`}
                  className="block rounded px-2 py-1 font-medium text-slate-700 hover:bg-[#0A4D3C]/5"
                >
                  {category.name}
                </a>
                {category.children.map((child) => (
                  <a
                    key={child.id}
                    href={`/shop?category=${child.slug}`}
                    className="ml-3 block rounded px-2 py-1 text-slate-500 hover:bg-[#0A4D3C]/5"
                  >
                    {child.name}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-[#0A4D3C]">All Products</h1>
            <p className="text-sm text-slate-500">{products.length} items</p>
          </div>
          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((filter) => (
                <Badge key={filter}>{filter}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              title={product.title}
              shortDescription={product.shortDescription}
              regularPrice={product.regularPrice}
              salePrice={product.salePrice}
              stockQuantity={product.stockQuantity}
              avgRating={product.avgRating}
              imageUrl={product.images[0]?.imageUrl}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
