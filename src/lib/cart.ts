import { cookies } from "next/headers";

const CART_COOKIE = "noornest_cart";

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export async function getCartItems(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export async function setCartItems(items: CartItem[]) {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
