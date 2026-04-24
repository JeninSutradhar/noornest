import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getShopProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();
  const products = await getShopProducts({ categorySlug: slug });

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500">
          <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {category.name}
        </nav>
        <h1 className="mt-2 text-3xl font-semibold text-[#0A4D3C]">{category.name}</h1>
        {category.description && <p className="mt-1 text-slate-600">{category.description}</p>}
      </div>
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
