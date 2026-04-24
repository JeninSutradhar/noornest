import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BASE_URL = "http://127.0.0.1:4010";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "change-this-admin-key";

let devServer: ChildProcessWithoutNullStreams | null = null;
let customerCookie = "";
let otherUserCookie = "";
let customerAddressId = "";
let latestOrderId = "";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 90; i += 1) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`);
      if (res.ok) return;
    } catch {
      // Ignore during startup.
    }
    await sleep(1000);
  }
  throw new Error("Server failed to start for integration tests");
}

async function requestJson(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    authCookie?: string;
  },
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
      ...(options?.authCookie ? { Cookie: options.authCookie } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = response.headers.get("set-cookie");
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  return { response, json, setCookie };
}

beforeAll(async () => {
  devServer = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "4010"],
    {
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "development" },
    },
  );
  await waitForServer();
});

afterAll(() => {
  if (devServer) devServer.kill("SIGTERM");
});

describe("NoorNest API integration", () => {
  it("auth login works for seeded customer", async () => {
    const { response, json, setCookie } = await requestJson("/api/auth/login", {
      method: "POST",
      body: { email: "customer@noornest.com", password: "Customer@123" },
    });
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(setCookie).toContain("noornest_auth=");
    customerCookie = setCookie!.split(";")[0]!;
  });

  it("auth guard behavior works (me + invalid login)", async () => {
    const meNoAuth = await requestJson("/api/auth/me");
    expect(meNoAuth.response.status).toBe(200);
    expect((meNoAuth.json.data as { user: unknown }).user).toBeNull();

    const badLogin = await requestJson("/api/auth/login", {
      method: "POST",
      body: { email: "customer@noornest.com", password: "WrongPassword@123" },
    });
    expect(badLogin.response.status).toBe(401);
    expect(badLogin.json.success).toBe(false);
  });

  it("store catalog endpoints work", async () => {
    const products = await requestJson("/api/store/products");
    expect(products.response.status).toBe(200);
    const items = (products.json.data as { items: Array<{ slug: string }> }).items;
    expect(items.length).toBeGreaterThan(0);

    const detail = await requestJson(`/api/store/products/${items[0]!.slug}`);
    expect(detail.response.status).toBe(200);
    expect(detail.json.success).toBe(true);
  });

  it("cart + coupon validate works", async () => {
    const products = await requestJson("/api/store/products");
    const item = (products.json.data as { items: Array<{ id: string }> }).items[0]!;

    const addCart = await requestJson("/api/store/cart", {
      method: "POST",
      body: { productId: item.id, quantity: 1 },
      authCookie: customerCookie,
    });
    expect(addCart.response.status).toBe(200);

    const viewCart = await requestJson("/api/store/cart", {
      authCookie: customerCookie,
    });
    expect(viewCart.response.status).toBe(200);

    const coupon = await requestJson("/api/store/coupons/validate", {
      method: "POST",
      body: { code: "RAMADAN20", subtotal: 2000, productIds: [item.id] },
      authCookie: customerCookie,
    });
    expect(coupon.response.status).toBe(200);
    expect((coupon.json.data as { valid: boolean }).valid).toBe(true);

    const badCoupon = await requestJson("/api/store/coupons/validate", {
      method: "POST",
      body: { code: "INVALID99", subtotal: 2000, productIds: [item.id] },
      authCookie: customerCookie,
    });
    expect(badCoupon.response.status).toBe(200);
    expect((badCoupon.json.data as { valid: boolean }).valid).toBe(false);
  });

  it("checkout + account order APIs work", async () => {
    const products = await requestJson("/api/store/products");
    const product = (products.json.data as { items: Array<{ id: string }> }).items[0]!;

    const addresses = await requestJson("/api/account/addresses", {
      authCookie: customerCookie,
    });
    expect(addresses.response.status).toBe(200);
    const address = (addresses.json.data as Array<{ id: string }>)[0]!;
    customerAddressId = address.id;

    const checkout = await requestJson("/api/store/checkout", {
      method: "POST",
      authCookie: customerCookie,
      body: {
        shippingAddressId: address.id,
        billingAddressId: address.id,
        paymentProvider: "COD",
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
    expect(checkout.response.status).toBe(200);
    latestOrderId = (checkout.json.data as { id: string }).id;
    expect(latestOrderId).toBeTruthy();

    const myOrders = await requestJson("/api/account/orders", {
      authCookie: customerCookie,
    });
    expect(myOrders.response.status).toBe(200);

    const myOrder = await requestJson(`/api/account/orders/${latestOrderId}`, {
      authCookie: customerCookie,
    });
    expect(myOrder.response.status).toBe(200);

    const invoice = await requestJson(`/api/account/orders/${latestOrderId}/invoice`, {
      authCookie: customerCookie,
    });
    expect(invoice.response.status).toBe(200);
  });

  it("checkout rejects invalid ownership and guest constraints", async () => {
    const products = await requestJson("/api/store/products");
    const product = (products.json.data as { items: Array<{ id: string }> }).items[0]!;

    const unauthorizedAddress = await requestJson("/api/store/checkout", {
      method: "POST",
      body: {
        shippingAddressId: customerAddressId,
        billingAddressId: customerAddressId,
        paymentProvider: "COD",
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
    expect(unauthorizedAddress.response.status).toBe(400);

    const invalidAddressOwner = await requestJson("/api/store/checkout", {
      method: "POST",
      authCookie: customerCookie,
      body: {
        shippingAddressId: "seed-customer-address-999",
        billingAddressId: "seed-customer-address-999",
        paymentProvider: "COD",
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
    expect(invalidAddressOwner.response.status).toBe(403);
  });

  it("order tracking validation and failure case works", async () => {
    const noIdentifier = await requestJson("/api/store/orders/track", {
      method: "POST",
      body: { orderNumber: "NN-SEED-0001" },
    });
    expect(noIdentifier.response.status).toBe(400);

    const wrongIdentity = await requestJson("/api/store/orders/track", {
      method: "POST",
      body: { orderNumber: "NN-SEED-0001", email: "wrong@example.com" },
    });
    expect(wrongIdentity.response.status).toBe(404);
  });

  it("account APIs enforce user isolation", async () => {
    const unique = Date.now();
    const register = await requestJson("/api/auth/register", {
      method: "POST",
      body: {
        name: `Second User ${unique}`,
        email: `second${unique}@noornest.com`,
        phone: `98877${String(unique).slice(-5)}`,
        password: "Second@123",
      },
    });
    expect(register.response.status).toBe(200);
    otherUserCookie = register.setCookie!.split(";")[0]!;

    const forbiddenOrderRead = await requestJson(`/api/account/orders/${latestOrderId}`, {
      authCookie: otherUserCookie,
    });
    expect(forbiddenOrderRead.response.status).toBe(404);

    const forbiddenInvoiceRead = await requestJson(
      `/api/account/orders/${latestOrderId}/invoice`,
      { authCookie: otherUserCookie },
    );
    expect(forbiddenInvoiceRead.response.status).toBe(404);
  });

  it("important admin endpoints work", async () => {
    const noAdminKey = await requestJson("/api/admin/products");
    expect(noAdminKey.response.status).toBe(401);

    const adminProducts = await requestJson("/api/admin/products", {
      headers: { "x-admin-api-key": ADMIN_API_KEY },
    });
    expect(adminProducts.response.status).toBe(200);

    const settings = await requestJson("/api/admin/settings?groupKey=tax", {
      headers: { "x-admin-api-key": ADMIN_API_KEY },
    });
    expect(settings.response.status).toBe(200);

    const users = await requestJson("/api/admin/users", {
      headers: { "x-admin-api-key": ADMIN_API_KEY },
    });
    expect(users.response.status).toBe(200);

    const wrongAdminKey = await requestJson("/api/admin/users", {
      headers: { "x-admin-api-key": "wrong-key" },
    });
    expect(wrongAdminKey.response.status).toBe(401);
  });
});
