"use client";

import Image from "next/image";
import { useState } from "react";
import { ZoomIn } from "lucide-react";

type GalleryImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
};

export function ProductGallery({
  images,
  title,
  variantImageUrl,
}: {
  images: GalleryImage[];
  title: string;
  variantImageUrl?: string | null;
}) {
  const computedImages =
    variantImageUrl && !images.some((img) => img.imageUrl === variantImageUrl)
      ? [{ id: "variant", imageUrl: variantImageUrl, altText: title }, ...images]
      : images;

  const [activeIdx, setActiveIdx] = useState(0);
  const active = computedImages[activeIdx] ?? computedImages[0];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse">
      {/* Main image */}
      <div className="relative flex-1 aspect-[1/1.1] min-h-[380px] overflow-hidden rounded-2xl border border-[#0A4D3C]/10 bg-[#F8F5EE] shadow-sm">
        {active && (
          <Image
            src={active.imageUrl}
            alt={active.altText || title}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
          />
        )}
        {/* Image count badge */}
        {computedImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            <ZoomIn className="h-3.5 w-3.5" />
            {activeIdx + 1} / {computedImages.length}
          </div>
        )}
        {/* Dot indicators (mobile) */}
        {computedImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
            {computedImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — horizontal on mobile, vertical on desktop */}
      {computedImages.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-y-auto md:overflow-x-visible md:w-[80px] md:pb-0"
          style={{ scrollbarWidth: "none" }}
        >
          {computedImages.map((img, i) => (
            <button
              key={img.id + i}
              onClick={() => setActiveIdx(i)}
              className={`relative aspect-square w-[70px] md:w-full flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === activeIdx
                  ? "border-[#0A4D3C] shadow-md ring-2 ring-[#0A4D3C]/20"
                  : "border-[#0A4D3C]/10 opacity-60 hover:opacity-100 hover:border-[#0A4D3C]/30"
              }`}
            >
              <Image
                src={img.imageUrl}
                alt={`${title} – view ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
