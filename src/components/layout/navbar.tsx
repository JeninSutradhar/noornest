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
      {/* ── Top bar — desktop only ─────────────────────────────────────── */}
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

      {/* ── Main bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-[#0A4D3C]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/noornest_logo.png"
              alt="NoorNest"
              width={56}
              height={56}
              className="h-10 w-10 object-contain sm:h-12 sm:w-12 md:h-[56px] md:w-[56px]"
              priority
            />
          </Link>

          {/* Search */}
          <form action="/search" className="min-w-0 flex-1">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0A4D3C]/45 sm:left-4 sm:h-4 sm:w-4" />
              <Input
                name="q"
                placeholder="Search products..."
                className="h-9 rounded-full border-[#0A4D3C]/15 bg-[#FDFBF6] pl-9 pr-3 text-sm shadow-sm sm:h-11 sm:pl-11 sm:pr-4 md:placeholder:text-sm"
              />
            </div>
          </form>

          {/* Icons */}
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/account"
              className="rounded-full border border-[#0A4D3C]/15 p-1.5 text-[#0A4D3C] hover:bg-[#0A4D3C]/5 sm:p-2"
              aria-label="Account"
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              href="/cart"
              className="relative rounded-full border border-[#0A4D3C]/15 p-1.5 text-[#0A4D3C] hover:bg-[#0A4D3C]/5 sm:p-2"
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-4 min-w-4 justify-center rounded-full border border-white bg-[#D4AF77] px-1 text-[9px] text-[#0A4D3C] sm:-right-3 sm:-top-3 sm:h-5 sm:min-w-5 sm:text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>
      </div>

      {/* ── Category bar — desktop only ───────────────────────────────────── */}
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

      {/* ── Category scroll — mobile only ─────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto border-t border-[#0A4D3C]/8 bg-green-50 px-3 py-2 md:hidden">
        <Link
          href="/shop"
          className="shrink-0 rounded-full bg-[#0A4D3C] px-3 py-1 text-xs font-semibold text-white"
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="shrink-0 rounded-full border border-[#0A4D3C]/20 bg-white px-3 py-1 text-xs text-slate-700 hover:border-[#0A4D3C]/40"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </header>
  );
}
