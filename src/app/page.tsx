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
    <div className="space-y-16">
      <section className="space-y-4">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative w-full overflow-hidden rounded-3xl border border-[#0A4D3C]/12 shadow-xl ${
              index === 0 ? "min-h-[440px] md:min-h-[500px]" : "min-h-[340px]"
            }`}
          >
            <Image
              src={slide.desktopImageUrl}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A4D3C]/78 via-[#0A4D3C]/45 to-transparent" />
            <div className="relative z-10 max-w-2xl p-8 text-white md:p-12">
              <Badge className="mb-4 bg-[#D4AF77]/90 text-[#0A4D3C]">NoorNest Premium Collection</Badge>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">{slide.title}</h1>
              <p className="mt-4 text-lg text-white/90">{slide.subtitle}</p>
              {slide.buttonLink && (
                <Button asChild className="mt-8 h-11 rounded-xl bg-white px-8 text-base text-[#0A4D3C] hover:bg-[#f3eee4]">
                  <Link href={slide.buttonLink}>{slide.buttonText || "Shop Now"}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-[#0A4D3C]">Featured Categories</h2>
          <Link href="/shop" className="text-sm font-medium text-[#0A4D3C]">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {data.featuredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-[#0A4D3C]/10 shadow-md"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={category.coverImageUrl || "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D3C]/80 via-[#0A4D3C]/25 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                <p className="line-clamp-2 text-xs text-white/80">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {data.sections.map((section) => (
        <section key={section.id} className="space-y-5">
          <div className="mb-4">
            <h2 className="text-3xl font-semibold text-[#0A4D3C]">{section.title}</h2>
            {section.subtitle && <p className="text-base text-slate-600">{section.subtitle}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="grid gap-4 rounded-3xl border border-[#0A4D3C]/10 bg-[#0A4D3C] p-6 text-white md:grid-cols-4">
        {[
          { icon: ShieldCheck, title: "Authentic Quality", text: "Carefully sourced premium materials" },
          { icon: Truck, title: "Fast Delivery", text: "Reliable shipping across India" },
          { icon: Gem, title: "Luxury Finishing", text: "Elegant craftsmanship for every product" },
          { icon: Star, title: "Loved by Families", text: "Highly rated by our customers" },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <item.icon className="mx-auto h-8 w-8 text-[#D4AF77]" />
            <h3 className="mt-2 font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-white/80">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <h2 className="mb-4 text-3xl font-semibold text-[#0A4D3C]">Customer Reviews</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="lux-card rounded-2xl p-5">
              <p className="font-semibold text-[#0A4D3C]">{review.title || "Verified Review"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{review.comment}</p>
              <p className="mt-3 text-xs text-slate-500">
                {review.user?.name || "NoorNest Customer"} on {review.product.title}
              </p>
            </article>
          ))}
        </div>
      </section>

      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-[#f7f4ef] transition hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 md:bottom-8 md:right-8"
        aria-label="Chat with NoorNest on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
