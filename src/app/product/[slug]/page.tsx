import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Home,
  Package,
  RefreshCw,
  Ruler,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  XCircle,
} from "lucide-react";

import { addToCartAction, buyNowAction } from "@/app/actions/cart";
import { ProductGallery } from "@/components/store/product-gallery";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/store/product-card";
import { prisma } from "@/lib/prisma";
import { getProductBySlug } from "@/lib/storefront";

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  const cls = sizes[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= Math.round(rating) ? "fill-[#D4AF77] text-[#D4AF77]" : "fill-none text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const selectedVariant = query.variant
    ? (product.variants.find((v) => v.id === query.variant) ?? product.variants[0] ?? null)
    : (product.variants[0] ?? null);

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: "ACTIVE",
      deletedAt: null,
      categories: {
        some: { categoryId: { in: product.categories.map((c) => c.categoryId) } },
      },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
  });

  const price = Number(
    selectedVariant?.salePrice ??
      selectedVariant?.regularPrice ??
      product.salePrice ??
      product.regularPrice,
  );
  const regularPrice = Number(selectedVariant?.regularPrice ?? product.regularPrice);
  const stockQty = selectedVariant?.stockQuantity ?? product.stockQuantity;
  const sku = selectedVariant?.sku ?? product.sku;
  const weight = Number(selectedVariant?.weightKg ?? product.weightKg ?? 0);
  const discountPct =
    price < regularPrice ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;

  const attributes =
    product.attributesJson && typeof product.attributesJson === "object"
      ? (product.attributesJson as Record<string, unknown>)
      : {};
  const tags = Array.isArray(product.tagsJson)
    ? product.tagsJson.filter((t): t is string => typeof t === "string")
    : [];
  const avgRating = Number(product.avgRating ?? 0);
  const ratingCount = product.reviews.length;

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: product.reviews.filter((rv) => rv.rating === r).length,
  }));

  const breadcrumbCategory = product.categories[0]?.category ?? null;

  return (
    <div className="min-h-screen">
      {/* ─── Breadcrumb ─── */}
      <div className="border-b border-[#0A4D3C]/8 bg-white/60">
        <nav className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-3 py-2.5 text-xs text-slate-500 md:gap-1.5 md:px-8 md:py-3 md:text-sm">
          <Link href="/" className="flex shrink-0 items-center gap-1 hover:text-[#0A4D3C]">
            <Home className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
          {breadcrumbCategory && (
            <>
              <Link
                href={`/category/${breadcrumbCategory.slug}`}
                className="shrink-0 hover:text-[#0A4D3C]"
              >
                {breadcrumbCategory.name}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            </>
          )}
          <span className="line-clamp-1 font-medium text-slate-700">
            {product.title}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-8 md:py-8">
        {/* ─── Hero: Gallery + Buy Panel ─── */}
        <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Gallery */}
          <ProductGallery
            images={product.images.map((img) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              altText: img.altText,
            }))}
            title={product.title}
            variantImageUrl={selectedVariant?.imageUrl}
          />

          {/* Buy Panel */}
          <div className="space-y-3 md:space-y-4 lg:sticky lg:top-24">
            {/* Main buy card */}
            <div className="lux-card rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-7">
              {/* Category chips */}
              <div className="mb-3 flex flex-wrap gap-1.5 md:mb-4 md:gap-2">
                {product.categories.slice(0, 3).map((entry) => (
                  <Link
                    key={entry.categoryId}
                    href={`/category/${entry.category.slug}`}
                    className="rounded-full border border-[#0A4D3C]/20 bg-[#0A4D3C]/6 px-2.5 py-0.5 text-[10px] font-medium text-[#0A4D3C] transition-colors hover:bg-[#0A4D3C]/12 md:px-3 md:py-1 md:text-xs"
                  >
                    {entry.category.name}
                  </Link>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold leading-snug text-slate-900 md:text-2xl lg:text-3xl">
                {product.title}
              </h1>
              {product.shortDescription && (
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 md:mt-2 md:text-sm">
                  {product.shortDescription}
                </p>
              )}

              {/* Rating row */}
              <div className="mt-3 flex items-center gap-2 md:mt-4 md:gap-3">
                <StarRow rating={avgRating} />
                <span className="text-xs font-semibold text-slate-700 md:text-sm">{avgRating.toFixed(1)}</span>
                <a
                  href="#reviews"
                  className="text-xs text-slate-400 underline-offset-2 hover:text-[#0A4D3C] hover:underline md:text-sm"
                >
                  {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                </a>
              </div>

              {/* Price block */}
              <div className="mt-4 flex flex-wrap items-end gap-2 md:mt-5 md:gap-3">
                <p className="text-3xl font-bold text-[#0A4D3C] md:text-4xl">
                  ₹{price.toLocaleString("en-IN")}
                </p>
                {discountPct > 0 && (
                  <>
                    <p className="mb-0.5 text-base text-slate-400 line-through md:mb-1 md:text-lg">
                      ₹{regularPrice.toLocaleString("en-IN")}
                    </p>
                    <span className="mb-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 md:mb-1 md:px-2.5 md:text-sm">
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>
              {discountPct > 0 && (
                <p className="mt-0.5 text-xs text-green-600">
                  You save ₹{(regularPrice - price).toLocaleString("en-IN")}
                </p>
              )}

              <div className="my-4 border-t border-[#0A4D3C]/8 md:my-5" />

              {/* Variant selector */}
              {product.variantType && product.variants.length > 0 && (
                <div className="mb-4 md:mb-5">
                  <p className="mb-2 text-xs font-semibold text-slate-700 md:text-sm">
                    Select{" "}
                    {product.variantType.charAt(0) +
                      product.variantType.slice(1).toLowerCase()}
                    :
                    {selectedVariant && (
                      <span className="ml-1.5 font-normal text-[#0A4D3C]">
                        {selectedVariant.value}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {product.variants.map((variant) => {
                      const vPrice = Number(
                        variant.salePrice ?? variant.regularPrice,
                      );
                      const isActive = selectedVariant?.id === variant.id;
                      return (
                        <Link
                          key={variant.id}
                          href={`/product/${product.slug}?variant=${variant.id}`}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 md:rounded-xl md:px-4 md:py-2 md:text-sm ${
                            isActive
                              ? "border-[#0A4D3C] bg-[#0A4D3C] text-white shadow-sm"
                              : "border-[#0A4D3C]/20 bg-white text-slate-700 hover:border-[#0A4D3C]/50 hover:bg-[#0A4D3C]/4"
                          }`}
                        >
                          {variant.value}
                          {vPrice !== price && !isActive && (
                            <span className="ml-1 text-[10px] opacity-70 md:ml-1.5 md:text-xs">
                              ₹{vPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Qty + CTAs */}
              <form action={addToCartAction} className="space-y-3 md:space-y-4">
                <input type="hidden" name="productId" value={product.id} />
                {selectedVariant && (
                  <input type="hidden" name="variantId" value={selectedVariant.id} />
                )}

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700 md:mb-2 md:text-sm">Quantity</p>
                  <QuantityStepper max={Math.max(stockQty, 1)} />
                </div>

                <div className="flex flex-col gap-2 pt-1 md:gap-3">
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl text-sm font-semibold md:h-12"
                    disabled={stockQty <= 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {stockQty > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  {stockQty > 0 && (
                    <Button
                      type="submit"
                      formAction={buyNowAction}
                      variant="secondary"
                      className="h-11 w-full rounded-xl text-sm font-semibold md:h-12"
                    >
                      Buy Now
                    </Button>
                  )}
                </div>
              </form>

              {/* Quick meta */}
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#0A4D3C]/8 pt-4 text-xs md:mt-5 md:gap-x-4 md:gap-y-2.5 md:pt-5 md:text-[13px]">
                {sku && (
                  <div className="flex items-center gap-1.5 text-slate-500 md:gap-2">
                    <Package className="h-3.5 w-3.5 shrink-0 text-[#0A4D3C]/60 md:h-4 md:w-4" />
                    <span>
                      SKU:{" "}
                      <span className="font-medium text-slate-700">{sku}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 md:gap-2">
                  {stockQty > 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 md:h-4 md:w-4" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400 md:h-4 md:w-4" />
                  )}
                  <span
                    className={
                      stockQty > 0
                        ? "font-medium text-emerald-600"
                        : "font-medium text-red-500"
                    }
                  >
                    {stockQty > 0 ? `In stock (${stockQty})` : "Out of stock"}
                  </span>
                </div>
                {(Number(product.dimensionLengthCm) > 0 ||
                  Number(product.dimensionWidthCm) > 0) && (
                  <div className="flex items-center gap-1.5 text-slate-500 md:gap-2">
                    <Ruler className="h-3.5 w-3.5 shrink-0 text-[#0A4D3C]/60 md:h-4 md:w-4" />
                    <span>
                      {Number(product.dimensionLengthCm)} ×{" "}
                      {Number(product.dimensionWidthCm)} ×{" "}
                      {Number(product.dimensionHeightCm)} cm
                    </span>
                  </div>
                )}
                {weight > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-500 md:gap-2">
                    <Scale className="h-3.5 w-3.5 shrink-0 text-[#0A4D3C]/60 md:h-4 md:w-4" />
                    <span>{weight} kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust strip */}
            <div className="lux-card rounded-xl p-3 md:rounded-2xl md:p-4">
              <div className="grid grid-cols-3 divide-x divide-[#0A4D3C]/10">
                <div className="flex flex-col items-center gap-1 px-1 text-center md:gap-1.5 md:px-2">
                  <Truck className="h-4 w-4 text-[#0A4D3C] md:h-5 md:w-5" />
                  <span className="text-[10px] font-semibold text-slate-700 md:text-xs">Free Delivery</span>
                  <span className="hidden text-[10px] leading-tight text-slate-400 sm:block">
                    on orders ₹999+
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-1 text-center md:gap-1.5 md:px-2">
                  <RefreshCw className="h-4 w-4 text-[#0A4D3C] md:h-5 md:w-5" />
                  <span className="text-[10px] font-semibold text-slate-700 md:text-xs">Easy Returns</span>
                  <span className="hidden text-[10px] leading-tight text-slate-400 sm:block">
                    7-day policy
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-1 text-center md:gap-1.5 md:px-2">
                  <ShieldCheck className="h-4 w-4 text-[#0A4D3C] md:h-5 md:w-5" />
                  <span className="text-[10px] font-semibold text-slate-700 md:text-xs">100% Authentic</span>
                  <span className="hidden text-[10px] leading-tight text-slate-400 sm:block">
                    certified products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Sticky section nav ─── */}
        <div className="sticky top-[52px] z-20 -mx-3 mt-6 border-b border-[#0A4D3C]/8 bg-white/95 px-3 backdrop-blur md:-mx-8 md:mt-10 md:px-8 md:top-[58px]">
          <nav className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "Description", href: "#description" },
              { label: "Specs", href: "#specifications" },
              { label: `Reviews (${ratingCount})`, href: "#reviews" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-[#0A4D3C] hover:text-[#0A4D3C] md:px-4 md:py-3 md:text-sm"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* ─── Description ─── */}
        <section id="description" className="scroll-mt-24 pt-6 md:scroll-mt-28 md:pt-10">
          <div className="lux-card rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-8">
            <h2 className="text-xl font-bold text-[#0A4D3C]">Product Description</h2>
            <div className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
              {product.description}
            </div>
            {product.islamicComplianceNote && (
              <div className="mt-6 flex gap-3 rounded-xl border border-[#0A4D3C]/15 bg-[#0A4D3C]/5 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0A4D3C]" />
                <div>
                  <p className="text-sm font-semibold text-[#0A4D3C]">
                    Islamic Compliance Note
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {product.islamicComplianceNote}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── Specifications ─── */}
        {(Object.keys(attributes).length > 0 ||
          tags.length > 0 ||
          Number(product.dimensionLengthCm) > 0 ||
          weight > 0) && (
          <section id="specifications" className="scroll-mt-24 pt-5 md:scroll-mt-28 md:pt-8">
            <div className="lux-card rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-8">
              <h2 className="text-xl font-bold text-[#0A4D3C]">Specifications</h2>
              <dl className="mt-5 grid gap-0 divide-y divide-[#0A4D3C]/6">
                {Number(product.dimensionLengthCm) > 0 && (
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-medium text-slate-500">Dimensions</dt>
                    <dd className="font-semibold text-slate-800">
                      {Number(product.dimensionLengthCm)} × {Number(product.dimensionWidthCm)} ×{" "}
                      {Number(product.dimensionHeightCm)} cm
                    </dd>
                  </div>
                )}
                {weight > 0 && (
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-medium text-slate-500">Weight</dt>
                    <dd className="font-semibold text-slate-800">{weight} kg</dd>
                  </div>
                )}
                {sku && (
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-medium text-slate-500">SKU</dt>
                    <dd className="font-semibold text-slate-800">{sku}</dd>
                  </div>
                )}
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 text-sm">
                    <dt className="font-medium capitalize text-slate-500">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="max-w-[60%] text-right font-semibold text-slate-800">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              {tags.length > 0 && (
                <div className="mt-5 border-t border-[#0A4D3C]/6 pt-5">
                  <p className="mb-3 text-sm font-semibold text-slate-500">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full border border-[#0A4D3C]/15 bg-[#0A4D3C]/6 px-3 py-1 text-xs font-medium text-[#0A4D3C]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Reviews ─── */}
        <section id="reviews" className="scroll-mt-24 pt-5 md:scroll-mt-28 md:pt-8">
          <div className="lux-card rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-8">
            <h2 className="text-xl font-bold text-[#0A4D3C]">Customer Reviews</h2>

            {/* Summary + distribution */}
            <div className="mt-6 flex flex-col gap-6 sm:flex-row">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[#0A4D3C]/5 px-8 py-6 text-center sm:w-44 sm:flex-shrink-0">
                <p className="text-6xl font-bold tabular-nums text-[#0A4D3C]">
                  {avgRating.toFixed(1)}
                </p>
                <div className="my-2 flex justify-center">
                  <StarRow rating={avgRating} size="md" />
                </div>
                <p className="text-sm text-slate-500">
                  {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                </p>
              </div>

              <div className="flex-1 space-y-2.5">
                {ratingDist.map(({ rating, count }) => {
                  const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3 text-sm">
                      <span className="w-10 text-right text-slate-400">{rating} ★</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D4AF77] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-left text-xs tabular-nums text-slate-400">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards */}
            {product.reviews.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {product.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-[#0A4D3C]/8 bg-[#0A4D3C]/[0.02] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0A4D3C] text-sm font-bold text-white">
                          {(review.user?.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {review.user?.name || "Verified Buyer"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.title && (
                      <p className="mt-3 text-sm font-semibold text-slate-800">{review.title}</p>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {review.comment}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-[#0A4D3C]/4 px-8 py-10 text-center">
                <Star className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                <p className="font-medium text-slate-500">No reviews yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Be the first to share your experience with this product.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Related products ─── */}
        {relatedProducts.length > 0 && (
          <section className="pt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A4D3C]">You May Also Like</h2>
              {breadcrumbCategory && (
                <Link
                  href={`/category/${breadcrumbCategory.slug}`}
                  className="flex items-center gap-1 text-sm text-[#0A4D3C]/70 hover:text-[#0A4D3C]"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  title={item.title}
                  shortDescription={item.shortDescription}
                  regularPrice={item.regularPrice}
                  salePrice={item.salePrice}
                  stockQuantity={item.stockQuantity}
                  avgRating={item.avgRating}
                  imageUrl={item.images[0]?.imageUrl}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
