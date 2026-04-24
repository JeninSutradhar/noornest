import { ApiError } from "@/lib/api";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken() {
  const cached = tokenCache;
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new ApiError(500, "Shiprocket credentials are not configured");
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(502, "Shiprocket authentication failed", text);
  }

  const data = (await response.json()) as { token: string };
  // Token is valid for 10 days; cache for 9.5 days
  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 9.5 * 24 * 60 * 60 * 1000,
  };
  return data.token;
}

async function shiprocketFetch<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = await getShiprocketToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(502, `Shiprocket request failed [${method} ${path}]`, text);
  }

  return (await response.json()) as T;
}

// ─── Order creation ────────────────────────────────────────────────────────

export type ShiprocketCreateOrderPayload = {
  order_id: string;
  order_date: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_phone: string;
  billing_email?: string;
  shipping_is_billing?: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_pincode?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;
  payment_method: "COD" | "Prepaid";
  sub_total: number;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
};

export type ShiprocketCreateOrderResponse = {
  order_id?: number;
  shipment_id?: number;
  status?: string;
  status_code?: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
};

export async function createShiprocketOrder(
  payload: ShiprocketCreateOrderPayload,
): Promise<ShiprocketCreateOrderResponse> {
  return shiprocketFetch<ShiprocketCreateOrderResponse>(
    "/orders/create/adhoc",
    "POST",
    payload,
  );
}

// ─── AWB assignment ────────────────────────────────────────────────────────

export type ShiprocketAssignAWBResponse = {
  awb_assign_status: number;
  response?: {
    data?: {
      awb_code?: string;
      courier_company_id?: number;
      courier_name?: string;
      shipment_id?: number;
    };
  };
};

export async function assignAWB(
  shipmentId: string,
  courierId?: number,
): Promise<ShiprocketAssignAWBResponse> {
  return shiprocketFetch<ShiprocketAssignAWBResponse>(
    "/courier/assign/awb",
    "POST",
    {
      shipment_id: shipmentId,
      ...(courierId ? { courier_id: courierId } : {}),
    },
  );
}

// ─── Pickup request ────────────────────────────────────────────────────────

export type ShiprocketPickupResponse = {
  pickup_status?: number;
  response?: {
    pickup_scheduled_date?: string;
    pickup_token_number?: string;
    status?: number;
    error?: string;
    others?: string;
  };
};

export async function requestPickup(
  shipmentId: string,
): Promise<ShiprocketPickupResponse> {
  return shiprocketFetch<ShiprocketPickupResponse>(
    "/courier/generate/pickup",
    "POST",
    { shipment_id: [shipmentId] },
  );
}

// ─── Label generation ─────────────────────────────────────────────────────

export type ShiprocketLabelResponse = {
  label_created?: number;
  label_url?: string;
  response?: { label_url?: string };
};

export async function generateLabel(
  shipmentId: string,
): Promise<ShiprocketLabelResponse> {
  return shiprocketFetch<ShiprocketLabelResponse>(
    "/courier/generate/label",
    "POST",
    { shipment_id: [shipmentId] },
  );
}

// ─── Manifest ─────────────────────────────────────────────────────────────

export type ShiprocketManifestResponse = {
  manifest_url?: string;
  status?: string;
};

export async function generateManifest(
  shipmentIds: string[],
): Promise<ShiprocketManifestResponse> {
  return shiprocketFetch<ShiprocketManifestResponse>(
    "/manifests/generate",
    "POST",
    { shipment_id: shipmentIds },
  );
}

export async function printManifest(
  orderIds: string[],
): Promise<ShiprocketManifestResponse> {
  return shiprocketFetch<ShiprocketManifestResponse>(
    "/manifests/print",
    "POST",
    { order_ids: orderIds },
  );
}

// ─── Invoice printing ─────────────────────────────────────────────────────

export type ShiprocketInvoiceResponse = {
  is_invoice_created?: boolean;
  invoice_url?: string;
  not_created?: number[];
};

export async function printShiprocketInvoice(
  orderIds: string[],
): Promise<ShiprocketInvoiceResponse> {
  return shiprocketFetch<ShiprocketInvoiceResponse>(
    "/orders/print/invoice",
    "POST",
    { ids: orderIds },
  );
}

// ─── Serviceability check ─────────────────────────────────────────────────

export type ShiprocketServiceabilityResponse = {
  status?: number;
  data?: {
    available_courier_companies?: Array<{
      id: number;
      name: string;
      freight_charge: number;
      estimated_delivery_days: number;
      cod: number;
      rating: number;
    }>;
  };
};

export async function checkServiceability(params: {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;
  cod: 0 | 1;
  declared_value?: number;
}): Promise<ShiprocketServiceabilityResponse> {
  const qs = new URLSearchParams({
    pickup_postcode: params.pickup_postcode,
    delivery_postcode: params.delivery_postcode,
    weight: String(params.weight),
    cod: String(params.cod),
    ...(params.declared_value
      ? { declared_value: String(params.declared_value) }
      : {}),
  });
  return shiprocketFetch<ShiprocketServiceabilityResponse>(
    `/courier/serviceability/?${qs}`,
    "GET",
  );
}

// ─── Cancel shipment ──────────────────────────────────────────────────────

export type ShiprocketCancelResponse = {
  message?: string;
  status?: number;
};

export async function cancelShiprocketOrder(
  orderIds: string[],
): Promise<ShiprocketCancelResponse> {
  return shiprocketFetch<ShiprocketCancelResponse>(
    "/orders/cancel",
    "POST",
    { ids: orderIds },
  );
}

// ─── Tracking ─────────────────────────────────────────────────────────────

export type ShiprocketTrackingActivity = {
  date?: string;
  activity?: string;
  location?: string;
  "sr-status"?: string;
  "sr-status-label"?: string;
};

export type ShiprocketTrackingResponse = {
  tracking_data?: {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: Array<{
      id?: number;
      awb_code?: string;
      courier_company_id?: number;
      shipment_id?: number;
      order_id?: number;
      pickup_date?: string;
      delivered_date?: string;
      weight?: string;
      packages?: number;
      current_status?: string;
      delivered_to?: string;
      destination?: string;
      consignee_name?: string;
      origin?: string;
      courier_agent_details?: string | null;
    }>;
    shipment_track_activities?: ShiprocketTrackingActivity[];
    track_url?: string;
    etd?: string;
    qc_response?: { qc_image?: string; qc_failed_reason?: string };
  };
};

export async function getShiprocketTracking(
  awbCode: string,
): Promise<ShiprocketTrackingResponse> {
  return shiprocketFetch<ShiprocketTrackingResponse>(
    `/courier/track/awb/${awbCode}`,
    "GET",
  );
}

// ─── Full shipment flow helper ─────────────────────────────────────────────
// Creates order → assigns AWB → requests pickup in one call.
// Returns the final shipment state.

export type FullShipmentResult = {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  awbCode: string | null;
  courierName: string | null;
  courierCode: string | null;
  trackingUrl: string | null;
  pickupScheduledDate: string | null;
  pickupToken: string | null;
};

export async function createFullShipment(
  payload: ShiprocketCreateOrderPayload,
): Promise<FullShipmentResult> {
  // Step 1: Create order
  const orderRes = await createShiprocketOrder(payload);
  if (!orderRes.order_id || !orderRes.shipment_id) {
    throw new ApiError(502, "Shiprocket did not return order/shipment IDs");
  }

  const shiprocketOrderId = String(orderRes.order_id);
  const shiprocketShipmentId = String(orderRes.shipment_id);

  // Step 2: Assign AWB (auto-select best courier)
  let awbCode: string | null = null;
  let courierName: string | null = null;
  let courierCode: string | null = null;
  let trackingUrl: string | null = null;

  try {
    const awbRes = await assignAWB(shiprocketShipmentId);
    if (awbRes.awb_assign_status === 1 && awbRes.response?.data) {
      awbCode = awbRes.response.data.awb_code ?? null;
      courierName = awbRes.response.data.courier_name ?? null;
      courierCode = awbRes.response.data.courier_company_id
        ? String(awbRes.response.data.courier_company_id)
        : null;
      if (awbCode) {
        trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
      }
    }
  } catch {
    // AWB assignment failure is non-fatal — admin can retry
  }

  // Step 3: Request pickup (only if AWB was assigned)
  let pickupScheduledDate: string | null = null;
  let pickupToken: string | null = null;

  if (awbCode) {
    try {
      const pickupRes = await requestPickup(shiprocketShipmentId);
      if (pickupRes.pickup_status === 1 && pickupRes.response) {
        pickupScheduledDate = pickupRes.response.pickup_scheduled_date ?? null;
        pickupToken = pickupRes.response.pickup_token_number ?? null;
      }
    } catch {
      // Pickup failure is non-fatal — admin can retry
    }
  }

  return {
    shiprocketOrderId,
    shiprocketShipmentId,
    awbCode,
    courierName,
    courierCode,
    trackingUrl,
    pickupScheduledDate,
    pickupToken,
  };
}
