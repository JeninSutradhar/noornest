"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  ImageIcon,
  TicketPercent,
  Star,
  Truck,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/homepage", label: "Homepage", icon: ImageIcon },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/shipments", label: "Shipping", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full min-h-0 w-full flex-col lg:w-auto">
      <div className="lux-card flex h-full min-h-0 flex-col rounded-2xl p-4 shadow-sm">
        <p className="shrink-0 px-2 pb-3 text-sm font-semibold text-[#0A4D3C]">NoorNest Admin</p>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-[#0A4D3C] text-white"
                    : "text-slate-700 hover:bg-[#0A4D3C]/8 hover:text-[#0A4D3C]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
