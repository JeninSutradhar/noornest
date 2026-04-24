"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Address = {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  phone: string;
  email?: string | null;
};

type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

type CheckoutClientProps = {
  addresses: Address[];
  items: CartItem[];
  userLoggedIn: boolean;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
  razorpayKeyId: string;
};

// Razorpay Checkout is loaded via <Script> — declare the global
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

export function CheckoutClient({
  addresses,
  items,
  userLoggedIn,
  userEmail,
  userPhone,
  userName,
  razorpayKeyId,
}: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canCheckout = !userLoggedIn || addresses.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const paymentProvider = String(formData.get("paymentProvider") ?? "RAZORPAY");

    // ── Step 1: Create NoorNest order ──────────────────────────────────────
    const checkoutRes = await fetch("/api/store/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddressId: userLoggedIn ? formData.get("shippingAddressId") : undefined,
        billingAddressId: userLoggedIn ? formData.get("billingAddressId") : undefined,
        guestEmail: !userLoggedIn ? formData.get("guestEmail") : undefined,
        guestPhone: !userLoggedIn ? formData.get("guestPhone") : undefined,
        paymentProvider,
        couponCode: formData.get("couponCode") || undefined,
        items,
      }),
    });

    const checkoutPayload = await checkoutRes.json();
    if (!checkoutRes.ok) {
      setError(checkoutPayload?.error?.message || "Checkout failed. Please try again.");
      setLoading(false);
      return;
    }

    const orderId: string = checkoutPayload.data.id;

    // ── COD / Bank Transfer: no payment gateway needed ─────────────────────
    if (paymentProvider !== "RAZORPAY") {
      router.push(`/checkout/success?orderId=${orderId}`);
      return;
    }

    // ── Step 2: Create Razorpay order ──────────────────────────────────────
    const rzpOrderRes = await fetch("/api/store/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const rzpOrderPayload = await rzpOrderRes.json();
    if (!rzpOrderRes.ok) {
      setError(rzpOrderPayload?.error?.message || "Could not initiate payment. Please try again.");
      setLoading(false);
      return;
    }

    const { razorpayOrderId, amount, currency } = rzpOrderPayload.data as {
      razorpayOrderId: string;
      amount: number;
      currency: string;
    };

    // ── Step 3: Open Razorpay Checkout popup ───────────────────────────────
    const prefillName = userLoggedIn
      ? (userName ?? "")
      : String(formData.get("guestName") ?? "");
    const prefillEmail = userLoggedIn
      ? (userEmail ?? "")
      : String(formData.get("guestEmail") ?? "");
    const prefillContact = userLoggedIn
      ? (userPhone ?? "")
      : String(formData.get("guestPhone") ?? "");

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      amount,
      currency,
      name: "NoorNest",
      description: "Premium Islamic Products",
      image: "/noornest_logo.png",
      order_id: razorpayOrderId,
      prefill: {
        name: prefillName,
        email: prefillEmail,
        contact: prefillContact,
      },
      theme: { color: "#0A4D3C" },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled. Your order is saved — you can retry from My Orders.");
          setLoading(false);
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // ── Step 4: Verify signature server-side ────────────────────────────
        const verifyRes = await fetch("/api/store/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });

        const verifyPayload = await verifyRes.json();
        if (!verifyRes.ok) {
          setError(
            verifyPayload?.error?.message ||
              "Payment verification failed. Please contact support with your order number.",
          );
          setLoading(false);
          return;
        }

        // ── Step 5: Clear cart and redirect to success ──────────────────────
        await fetch("/api/store/cart", { method: "DELETE" });
        router.push(`/checkout/success?orderId=${orderId}`);
      },
    });

    rzp.open();
  }

  return (
    <>
      {/* Load Razorpay Checkout script once */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-[#0A4D3C]/10 bg-white p-5"
      >
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Checkout</h1>

        {/* ── Address section ─────────────────────────────────────────────── */}
        {userLoggedIn ? (
          <>
            {addresses.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Please add an address before placing an order.{" "}
                <Link href="/account/addresses" className="font-medium underline">
                  Add address
                </Link>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">
                Shipping Address
              </label>
              <select
                name="shippingAddressId"
                required
                className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
                disabled={addresses.length === 0}
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.fullName} — {address.line1}, {address.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">
                Billing Address
              </label>
              <select
                name="billingAddressId"
                required
                className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
                disabled={addresses.length === 0}
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.fullName} — {address.line1}, {address.city}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border border-[#0A4D3C]/10 bg-[#0A4D3C]/[0.03] p-3">
            <p className="text-sm text-slate-600">
              Guest checkout.{" "}
              <Link href="/login?next=/checkout" className="font-medium text-[#0A4D3C]">
                Login
              </Link>{" "}
              for faster checkout and order history.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">Full Name</label>
              <input
                type="text"
                name="guestName"
                className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">Email</label>
              <input
                type="email"
                name="guestEmail"
                required
                className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">
                Phone (optional)
              </label>
              <input
                type="text"
                name="guestPhone"
                className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
                placeholder="+91 98XXXXXXXX"
              />
            </div>
          </div>
        )}

        {/* ── Payment method ───────────────────────────────────────────────── */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">Payment Method</label>
          <select
            name="paymentProvider"
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          >
            <option value="RAZORPAY">Pay Online (UPI, Cards, Netbanking)</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>

        {/* ── Coupon ───────────────────────────────────────────────────────── */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#0A4D3C]">
            Coupon Code (optional)
          </label>
          <input
            name="couponCode"
            placeholder="e.g. RAMADAN20"
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !canCheckout || items.length === 0}
          className="w-full bg-[#0A4D3C] hover:bg-[#0A4D3C]/90"
        >
          {loading ? "Processing…" : "Place Order"}
        </Button>
      </form>
    </>
  );
}
