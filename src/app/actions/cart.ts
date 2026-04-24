"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCartItems, setCartItems } from "@/lib/cart";

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const variantIdRaw = formData.get("variantId");
  const variantId = variantIdRaw ? String(variantIdRaw) : undefined;
  const quantity = Number(formData.get("quantity") || "1");

  if (!productId || quantity < 1) return;
  const cart = await getCartItems();
  const existing = cart.find(
    (item) => item.productId === productId && item.variantId === variantId,
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, variantId, quantity });
  }
  await setCartItems(cart);
  revalidatePath("/cart");
}

export async function buyNowAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const variantIdRaw = formData.get("variantId");
  const variantId = variantIdRaw ? String(variantIdRaw) : undefined;
  const quantity = Number(formData.get("quantity") || "1");

  if (!productId || quantity < 1) return;
  const cart = await getCartItems();
  const existing = cart.find(
    (item) => item.productId === productId && item.variantId === variantId,
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, variantId, quantity });
  }
  await setCartItems(cart);
  redirect("/checkout");
}

export async function updateCartQuantityAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const variantIdRaw = formData.get("variantId");
  const variantId = variantIdRaw ? String(variantIdRaw) : undefined;
  const quantity = Number(formData.get("quantity") || "1");
  const cart = await getCartItems();
  const updated = cart
    .map((item) =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity }
        : item,
    )
    .filter((item) => item.quantity > 0);
  await setCartItems(updated);
  revalidatePath("/cart");
}

/**
 * Removes stale product IDs from the cart cookie.
 * Must be called from a Server Action (not directly from a page component).
 */
export async function pruneCartAction(validProductIds: string[]) {
  const cart = await getCartItems();
  const pruned = cart.filter((item) => validProductIds.includes(item.productId));
  if (pruned.length !== cart.length) {
    await setCartItems(pruned);
  }
}
