import { z } from "zod";

import { ApiError, withApiHandler } from "@/lib/api";
import { getCartItems, setCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
});

export async function GET() {
  return withApiHandler(async () => {
    const items = await getCartItems();
    if (items.length === 0) return { items: [], subtotal: 0 };

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) }, deletedAt: null },
      include: { variants: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    const detailed = items.map((item) => {
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
        title: product.title,
        slug: product.slug,
        sku: variant?.sku ?? product.sku,
        image: product.images[0]?.imageUrl ?? null,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const validItems = detailed.filter(Boolean);
    const subtotal = validItems.reduce((sum, item) => sum + (item?.lineTotal ?? 0), 0);
    return { items: validItems, subtotal };
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = itemSchema.parse(await request.json());
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: { variants: true },
    });
    if (!product || product.deletedAt || product.status !== "ACTIVE") {
      throw new ApiError(404, "Product not available");
    }
    if (body.variantId && !product.variants.find((item) => item.id === body.variantId)) {
      throw new ApiError(400, "Invalid product variant");
    }

    const cart = await getCartItems();
    const index = cart.findIndex(
      (item) => item.productId === body.productId && item.variantId === body.variantId,
    );
    if (index >= 0) {
      cart[index]!.quantity += body.quantity;
    } else {
      cart.push(body);
    }
    await setCartItems(cart);
    return { items: cart };
  });
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const body = z
      .object({ items: z.array(itemSchema.extend({ quantity: z.number().int().min(0) })) })
      .parse(await request.json());
    const sanitized = body.items.filter((item) => item.quantity > 0);
    await setCartItems(sanitized);
    return { items: sanitized };
  });
}

export async function DELETE() {
  return withApiHandler(async () => {
    await setCartItems([]);
    return { cleared: true };
  });
}
