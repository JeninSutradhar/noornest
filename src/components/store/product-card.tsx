import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProductCardProps = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  regularPrice: unknown;
  salePrice: unknown;
  stockQuantity: number;
  avgRating: unknown;
  imageUrl?: string | null;
};

export function ProductCard(props: ProductCardProps) {
  const regular = Number(props.regularPrice);
  const sale = props.salePrice != null ? Number(props.salePrice) : null;
  const price = sale ?? regular;
  const rating = Number(props.avgRating || 0).toFixed(1);

  return (
    <article className="group lux-card rounded-xl p-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-2xl sm:p-3">
      <Link href={`/product/${props.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F8F3E9] sm:rounded-xl">
          <Image
            src={props.imageUrl || "/placeholder.png"}
            alt={props.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {sale && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:left-2 sm:top-2 sm:text-[10px]">
              SALE
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 text-xs font-semibold text-slate-900 sm:mt-3 sm:text-sm md:text-base">
          {props.title}
        </h3>
        <p className="mt-0.5 hidden line-clamp-1 text-xs text-slate-500 sm:block">
          {props.shortDescription}
        </p>
      </Link>

      <div className="mt-2 flex items-center justify-between sm:mt-3">
        <div>
          <p className="text-sm font-bold text-[#0A4D3C] sm:text-base">
            Rs. {price.toFixed(0)}
          </p>
          {sale && (
            <p className="text-[10px] text-slate-400 line-through sm:text-xs">
              Rs. {regular.toFixed(0)}
            </p>
          )}
        </div>
        <Badge className="bg-[#0A4D3C]/8 px-1.5 py-0.5 text-[9px] sm:text-xs">
          ★ {rating}
        </Badge>
      </div>

      <div className="mt-2 flex items-center justify-between gap-1 sm:mt-3">
        <span
          className={`text-[10px] sm:text-xs ${
            props.stockQuantity > 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {props.stockQuantity > 0 ? "In stock" : "Out of stock"}
        </span>
        <Button asChild size="sm" className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs">
          <Link href={`/product/${props.slug}`}>View</Link>
        </Button>
      </div>
    </article>
  );
}
