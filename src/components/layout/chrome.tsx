"use client";

import { usePathname } from "next/navigation";

function isAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/admin")
  );
}

export function Chrome({
  children,
  navbar,
  footer,
  mobileNav,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
  mobileNav: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = isAuthRoute(pathname);
  const isAdminShell = pathname.startsWith("/admin") && pathname !== "/admin/login";

  const mainClass = hideChrome
    ? isAdminShell
      ? "min-h-screen w-full flex-1 bg-[#f7f4ef]"
      : "mx-auto flex w-full max-w-[1400px] flex-1 items-center justify-center px-4 py-10 md:px-8"
    : "mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-8 md:px-8 md:pb-10 md:pt-10";

  return (
    <>
      {!hideChrome && navbar}
      <main className={mainClass}>
        {children}
      </main>
      {!hideChrome && footer}
      {!hideChrome && mobileNav}
    </>
  );
}
