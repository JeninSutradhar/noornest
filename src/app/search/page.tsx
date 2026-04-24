import { getShopProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getShopProducts({ q });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">
        Search results {q ? `for "${q}"` : ""}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
