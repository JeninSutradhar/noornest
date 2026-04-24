import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Chrome } from "@/components/layout/chrome";

export const metadata: Metadata = {
  title: "NoorNest | Premium Islamic Store",
  description:
    "Premium Islamic products including Velvet Qurans, wall art, calligraphy, decor and gifting essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Chrome navbar={<Navbar />} footer={<Footer />} mobileNav={<MobileNav />}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
