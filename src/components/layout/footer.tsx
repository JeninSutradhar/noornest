import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#0A4D3C]/10 bg-[#0A4D3C] text-white md:mt-20">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-8 md:py-12">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <Image
              src="/noornest_logo.png"
              alt="NoorNest"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
            />
            <span className="text-lg font-semibold">NoorNest</span>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Premium Islamic lifestyle essentials crafted with elegance and care.
          </p>
          <p className="mt-3 text-xs text-white/60">
            Halal-conscious sourcing • Premium packaging • Pan-India delivery
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <Link href="/about" className="block hover:text-white">About Us</Link>
            <Link href="/contact" className="block hover:text-white">Contact</Link>
            <Link href="/track-order" className="block hover:text-white">Track Order</Link>
            <Link href="/shipping-policy" className="block hover:text-white">Shipping Policy</Link>
          </div>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-semibold">Policies</h4>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <Link href="/privacy-policy" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/returns-policy" className="block hover:text-white">Returns Policy</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold">Newsletter</h4>
          <p className="mt-1 text-xs text-white/70">Get exclusive offers and new arrivals.</p>
          <form className="mt-3 space-y-2">
            <Input
              type="email"
              required
              placeholder="Enter your email"
              className="h-10 rounded-xl border-white/20 bg-white text-slate-900 placeholder:text-slate-400"
            />
            <Button type="submit" variant="secondary" className="w-full">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} NoorNest. Crafted with care for your home.
      </div>
    </footer>
  );
}
