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
    <article className="group lux-card rounded-2xl p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <Link href={`/product/${props.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F8F3E9]">
          <Image
            src={props.imageUrl || "/placeholder.png"}
            alt={props.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900">{props.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{props.shortDescription}</p>
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-[#0A4D3C]">Rs. {price.toFixed(2)}</p>
          {sale && (
            <p className="text-xs text-slate-400 line-through">Rs. {regular.toFixed(2)}</p>
          )}
        </div>
        <Badge className="bg-[#0A4D3C]/8">{rating} star</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-xs ${props.stockQuantity > 0 ? "text-emerald-600" : "text-red-600"}`}
        >
          {props.stockQuantity > 0 ? "In stock" : "Out of stock"}
        </span>
        <Button asChild size="sm">
          <Link href={`/product/${props.slug}`}>View</Link>
        </Button>
      </div>
    </article>
  );
}
