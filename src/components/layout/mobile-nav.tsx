"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/shop", icon: Search, label: "Shop" },
  { href: "/cart", icon: ShoppingBag, label: "Cart" },
  { href: "/account", icon: User, label: "Account" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0A4D3C]/10 bg-white/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                active ? "text-[#0A4D3C]" : "text-slate-400",
              )}
            >
              <link.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
