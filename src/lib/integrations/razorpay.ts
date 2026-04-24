import crypto from "crypto";

import { ApiError } from "@/lib/api";

type RazorpayOrderPayload = {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

const API_BASE = "https://api.razorpay.com/v1";

function getKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new ApiError(500, "Razorpay keys are not configured");
  return keyId;
}

function getKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new ApiError(500, "Razorpay keys are not configured");
  return keySecret;
}

function getAuthHeader() {
  return `Basic ${Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString("base64")}`;
}

export async function createRazorpayOrder(payload: RazorpayOrderPayload) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency ?? "INR",
      receipt: payload.receipt,
      notes: payload.notes,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(502, "Failed to create Razorpay order", text);
  }

  return (await response.json()) as { id: string; amount: number; currency: string };
}

/**
 * Verifies the payment signature returned by Razorpay Checkout (client-side flow).
 * Uses RAZORPAY_KEY_SECRET — NOT the webhook secret.
 * HMAC body: razorpay_order_id + "|" + razorpay_payment_id
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const secret = getKeySecret();
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === razorpaySignature;
}

/**
 * Verifies a Razorpay server webhook event.
 * Uses RAZORPAY_WEBHOOK_SECRET (set in Razorpay Dashboard → Webhooks).
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  razorpaySignature: string,
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return expected === razorpaySignature;
}

// Keep old export name as alias so existing webhook route still compiles
export const verifyRazorpaySignature = verifyRazorpayPaymentSignature;
