import Link from "next/link";

import { requireUserOrRedirect } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { getTaxConfig } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/store/checkout-client";

export default async function CheckoutPage() {
  const user = await requireUserOrRedirect("/checkout");
  const cartItems = await getCartItems();

  const [addresses, taxConfig] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
      select: { id: true, fullName: true, line1: true, city: true, phone: true, email: true },
    }),
    getTaxConfig(),
  ]);

  const products = await prisma.product.findMany({
    where: {
      id: { in: cartItems.map((item) => item.productId) },
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true, salePrice: true, regularPrice: true },
  });

  const validCartItems = cartItems.filter((item) =>
    products.some((p) => p.id === item.productId),
  );

  // Mirror the exact same calculation as the checkout API
  const subtotal = validCartItems.reduce((sum, item) => {
    const p = products.find((product) => product.id === item.productId);
    if (!p) return sum;
    return sum + Number(p.salePrice ?? p.regularPrice) * item.quantity;
  }, 0);
  const shipping = subtotal >= 1499 ? 0 : 99;
  const taxAmount = taxConfig.enabled
    ? Number(((subtotal * taxConfig.rate) / 100).toFixed(2))
    : 0;
  const total = subtotal + shipping + taxAmount;

  if (validCartItems.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg text-slate-600">Your cart is empty.</p>
        <Link href="/shop" className="font-medium text-[#0A4D3C] underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {addresses.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No saved address found. Please{" "}
            <Link href="/account/addresses?next=/checkout" className="font-medium underline">
              add a delivery address
            </Link>{" "}
            to continue.
          </div>
        )}
        <CheckoutClient
          addresses={addresses}
          items={validCartItems}
          userEmail={user.email}
          userPhone={user.phone}
          userName={user.name}
          razorpayKeyId={process.env.RAZORPAY_KEY_ID ?? ""}
        />
      </div>

      <aside className="h-fit rounded-xl border border-[#0A4D3C]/10 bg-white p-5">
        <h2 className="font-semibold text-[#0A4D3C]">Order Summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Items ({validCartItems.length})</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Shipping</span>
            <span>{shipping === 0 ? "Free" : `Rs. ${shipping.toFixed(2)}`}</span>
          </div>
          {taxConfig.enabled && taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">GST ({taxConfig.rate}%)</span>
              <span>Rs. {taxAmount.toFixed(2)}</span>
            </div>
          )}
          {shipping > 0 && (
            <p className="text-xs text-slate-400">
              Free shipping on orders above Rs. 1,499
            </p>
          )}
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
