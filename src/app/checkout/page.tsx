import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/store/checkout-client";

export default async function CheckoutPage() {
  const [user, cartItems] = await Promise.all([getCurrentUser(), getCartItems()]);

  const addresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: { isDefault: "desc" },
        select: {
          id: true,
          fullName: true,
          line1: true,
          city: true,
          phone: true,
          email: true,
        },
      })
    : [];

  const products = await prisma.product.findMany({
    where: {
      id: { in: cartItems.map((item) => item.productId) },
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true, salePrice: true, regularPrice: true },
  });

  // Filter cart to only items with valid, active products
  const validCartItems = cartItems.filter((item) =>
    products.some((p) => p.id === item.productId),
  );

  const subtotal = validCartItems.reduce((sum, item) => {
    const p = products.find((product) => product.id === item.productId);
    if (!p) return sum;
    return sum + Number(p.salePrice ?? p.regularPrice) * item.quantity;
  }, 0);
  const shipping = subtotal >= 1499 ? 0 : 99;
  const total = subtotal + shipping;

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
        {!user && (
          <div className="rounded-xl border border-[#0A4D3C]/10 bg-white p-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login?next=/checkout" className="font-medium text-[#0A4D3C]">
              Login for faster checkout
            </Link>
            .
          </div>
        )}
        {user && addresses.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No saved address found. Add one in{" "}
            <Link href="/account/addresses" className="font-medium underline">
              My Addresses
            </Link>{" "}
            or checkout as guest.
          </div>
        )}
        <CheckoutClient
          addresses={addresses}
          items={validCartItems}
          userLoggedIn={Boolean(user)}
          userEmail={user?.email}
          userPhone={user?.phone}
          userName={user?.name}
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
