import Image from "next/image";
import Link from "next/link";

import { updateCartQuantityAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { getCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export default async function CartPage() {
  const cartItems = await getCartItems();
  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((item) => item.productId) } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
  });

  const detailed = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null;
      const unitPrice = Number(
        variant?.salePrice ?? variant?.regularPrice ?? product.salePrice ?? product.regularPrice,
      );
      return {
        ...item,
        product,
        variant,
        lineTotal: unitPrice * item.quantity,
        unitPrice,
      };
    })
    .filter(Boolean);

  const subtotal = detailed.reduce((sum, item) => sum + (item?.lineTotal ?? 0), 0);
  const shipping = subtotal >= 1499 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Your Cart</h1>
        {detailed.length === 0 ? (
          <div className="rounded-xl border border-[#0A4D3C]/10 bg-white p-6">
            <p>Your cart is empty.</p>
            <Button asChild className="mt-4">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          detailed.map((item) => (
            <article key={`${item!.product.id}-${item!.variant?.id || "base"}`} className="flex gap-4 rounded-xl border border-[#0A4D3C]/10 bg-white p-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-md">
                <Image
                  src={item!.product.images[0]?.imageUrl || "/vercel.svg"}
                  alt={item!.product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-[#0A4D3C]">{item!.product.title}</h2>
                <p className="text-sm text-slate-500">Rs. {item!.unitPrice.toFixed(2)}</p>
                <form action={updateCartQuantityAction} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="productId" value={item!.product.id} />
                  <input type="hidden" name="variantId" value={item!.variant?.id || ""} />
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    defaultValue={item!.quantity}
                    className="h-9 w-20 rounded-md border border-[#0A4D3C]/20 px-2"
                  />
                  <Button size="sm" variant="outline" type="submit">
                    Update
                  </Button>
                </form>
              </div>
              <p className="font-semibold text-[#0A4D3C]">Rs. {item!.lineTotal.toFixed(2)}</p>
            </article>
          ))
        )}
      </section>

      <aside className="h-fit rounded-xl border border-[#0A4D3C]/10 bg-white p-4">
        <h2 className="font-semibold text-[#0A4D3C]">Order Summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>Rs. {shipping.toFixed(2)}</span>
          </div>
          <div className="mt-2 border-t pt-2 font-semibold flex justify-between">
            <span>Total</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        </div>
        <Button asChild className="mt-4 w-full" disabled={detailed.length === 0}>
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
