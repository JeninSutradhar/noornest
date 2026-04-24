import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User, Search, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export async function Navbar() {
  const [categories, cartItems] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    getCartItems(),
  ]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-[#0A4D3C]/10 bg-white/90 backdrop-blur-xl">
      <div className="hidden border-b border-white/10 bg-[#0A4D3C] md:block">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between px-8 text-xs text-[#F8F3E9]">
          <p>Delivering premium Islamic products across India</p>
          <div className="flex items-center gap-5 text-[#F8F3E9]/90">
            <Link href="/track-order" className="hover:text-white">Track Order</Link>
            <Link href="/shipping-policy" className="hover:text-white">Shipping</Link>
            <Link href="/contact" className="hover:text-white">Support</Link>
          </div>
        </div>
      </div>
      <div className="sticky top-0 z-50 border-b border-[#0A4D3C]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2 md:px-8">
          <Link href="/" className="flex items-center">
          <Image
            src="/noornest_logo.png"
            alt="NoorNest"
            width={74}
            height={74}
            className="h-16 w-16 object-contain md:h-[74px] md:w-[74px]"
            priority
          />
          </Link>
          <form action="/search" className="flex-1">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-[#0A4D3C]/45" />
              <Input
                name="q"
                placeholder="Search velvet Qurans, wall art, gifts..."
                className="h-11 rounded-full border-[#0A4D3C]/15 bg-[#FDFBF6] pl-11 pr-4 shadow-sm"
              />
            </div>
          </form>
          <nav className="flex items-center gap-2">
            <Link href="/account" className="rounded-full border border-[#0A4D3C]/15 p-2 text-[#0A4D3C] hover:bg-[#0A4D3C]/5">
              <User className="h-4 w-4" />
            </Link>
            <Link href="/cart" className="relative rounded-full border border-[#0A4D3C]/15 p-2 text-[#0A4D3C] hover:bg-[#0A4D3C]/5">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge className="absolute -right-3 -top-3 h-5 min-w-5 justify-center rounded-full border border-white bg-[#D4AF77] px-1 text-[10px] text-[#0A4D3C]">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>
      </div>
      <div className="hidden border-t border-[#0A4D3C]/8 bg-green-100 md:block">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-6 overflow-x-auto px-8">
          <Link href="/shop" className="whitespace-nowrap text-sm font-semibold text-[#0A4D3C]">
            All Categories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="flex items-center gap-1 whitespace-nowrap text-sm text-slate-700 hover:text-[#0A4D3C]"
            >
              {category.name}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
