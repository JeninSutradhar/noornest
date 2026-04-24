import Link from "next/link";
import { User, MapPin, Package, MessageSquare, LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { requireUserOrRedirect } from "@/lib/auth";

const links = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reviews", label: "Reviews", icon: MessageSquare },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/account");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lux-card rounded-2xl p-4">
        <div className="mb-4 rounded-xl bg-[#0A4D3C]/6 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="font-semibold text-[#0A4D3C]">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#0A4D3C]/6 hover:text-[#0A4D3C]"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0A4D3C]/15 px-3 py-2 text-sm font-medium text-[#0A4D3C] hover:bg-[#0A4D3C]/6"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
