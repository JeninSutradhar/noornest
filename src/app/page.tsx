import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, Gem, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/store/product-card";
import { getHomepageData } from "@/lib/storefront";

const WHATSAPP_HREF =
  "https://api.whatsapp.com/send/?phone=919828075255&text=Hi+NoorNest%21+I%27m+interested+in+your+products.&type=phone_number&app_absent=0";

export default async function Home() {
  const data = await getHomepageData();
  const heroSlides = data.heroSlides.slice(0, 4);

  return (
    <div className="space-y-10 md:space-y-16">

      {/* ── Hero slides ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative w-full overflow-hidden rounded-2xl border border-[#0A4D3C]/12 shadow-lg ${
              index === 0 ? "min-h-[280px] sm:min-h-[380px] md:min-h-[500px]" : "min-h-[200px] sm:min-h-[280px] md:min-h-[340px]"
            }`}
          >
            <Image
              src={slide.desktopImageUrl}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A4D3C]/80 via-[#0A4D3C]/45 to-transparent" />
            <div className="relative z-10 max-w-xl p-5 text-white sm:p-8 md:p-12">
              <Badge className="mb-2 bg-[#D4AF77]/90 text-[#0A4D3C] text-[10px] sm:text-xs">
                NoorNest Premium Collection
              </Badge>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl md:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
              <p className="mt-2 text-sm text-white/90 sm:mt-4 sm:text-base md:text-lg line-clamp-2">
                {slide.subtitle}
              </p>
              {slide.buttonLink && (
                <Button
                  asChild
                  className="mt-4 h-9 rounded-xl bg-white px-5 text-sm text-[#0A4D3C] hover:bg-[#f3eee4] sm:mt-6 sm:h-11 sm:px-8 sm:text-base"
                >
                  <Link href={slide.buttonLink}>{slide.buttonText || "Shop Now"}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* ── Featured Categories ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0A4D3C] sm:text-2xl md:text-3xl">
            Featured Categories
          </h2>
          <Link href="/shop" className="text-xs font-medium text-[#0A4D3C] sm:text-sm">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {data.featuredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-xl border border-[#0A4D3C]/10 shadow-sm"
            >
              <div className="relative h-32 w-full sm:h-36 md:h-40">
                <Image
                  src={
                    category.coverImageUrl ||
                    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800"
                  }
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D3C]/80 via-[#0A4D3C]/20 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                <h3 className="text-sm font-semibold text-white sm:text-base">{category.name}</h3>
                <p className="hidden line-clamp-1 text-xs text-white/80 sm:block">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Product sections ─────────────────────────────────────────────── */}
      {data.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0A4D3C] sm:text-2xl md:text-3xl">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="mt-1 text-sm text-slate-600 sm:text-base">{section.subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {section.products.slice(0, section.productsToShow).map((product) => (
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
      ))}

      {/* ── Trust badges ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-[#0A4D3C]/10 bg-[#0A4D3C] p-5 text-white sm:grid-cols-4 sm:gap-4 sm:p-6 md:rounded-3xl">
        {[
          { icon: ShieldCheck, title: "Authentic Quality", text: "Carefully sourced premium materials" },
          { icon: Truck, title: "Fast Delivery", text: "Reliable shipping across India" },
          { icon: Gem, title: "Luxury Finishing", text: "Elegant craftsmanship for every product" },
          { icon: Star, title: "Loved by Families", text: "Highly rated by our customers" },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <item.icon className="mx-auto h-6 w-6 text-[#D4AF77] sm:h-8 sm:w-8" />
            <h3 className="mt-2 text-xs font-semibold text-white sm:text-sm">{item.title}</h3>
            <p className="mt-0.5 text-[10px] text-white/80 sm:text-xs">{item.text}</p>
          </div>
        ))}
      </section>

      {/* ── Customer Reviews ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#0A4D3C] sm:text-2xl md:text-3xl">
          Customer Reviews
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
          {data.reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="lux-card rounded-xl p-4 sm:rounded-2xl sm:p-5">
              <p className="text-sm font-semibold text-[#0A4D3C] sm:text-base">
                {review.title || "Verified Review"}
              </p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                {review.comment}
              </p>
              <p className="mt-2 text-[10px] text-slate-500 sm:mt-3 sm:text-xs">
                {review.user?.name || "NoorNest Customer"} on {review.product.title}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── WhatsApp FAB ─────────────────────────────────────────────────── */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-[#f7f4ef] transition hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:h-14 sm:w-14 md:bottom-8 md:right-8"
        aria-label="Chat with NoorNest on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
