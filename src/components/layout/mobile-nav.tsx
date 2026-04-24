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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0A4D3C]/10 bg-white md:hidden">
      <div className="grid grid-cols-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs",
                active ? "text-[#0A4D3C]" : "text-slate-500",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
