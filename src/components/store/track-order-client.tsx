"use client";

import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type TrackingActivity = {
  date?: string;
  activity?: string;
  location?: string;
  "sr-status-label"?: string;
};

type OrderResult = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: string | number;
  createdAt: string;
  shipment?: {
    status: string;
    awbCode?: string | null;
    courierName?: string | null;
    trackingUrl?: string | null;
  } | null;
  items: Array<{
    productTitle: string;
    quantity: number;
    unitPrice: string | number;
  }>;
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const STATUS_ICON: Record<string, React.ReactNode> = {
  DELIVERED: <CheckCircle className="h-4 w-4 text-green-600" />,
  SHIPPED: <Truck className="h-4 w-4 text-blue-600" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
};

export function TrackOrderClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [activities, setActivities] = useState<TrackingActivity[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    setActivities([]);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/store/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: fd.get("orderNumber"),
        email: fd.get("email") || undefined,
        phone: fd.get("phone") || undefined,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Order not found");
      return;
    }

    setOrder(json.data.order);
    setActivities(json.data.trackingActivities ?? []);
  }

  return (
    <div className="mt-5 space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="orderNumber"
          required
          placeholder="Order number (e.g. NN-ABC123-XYZ)"
          className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          />
          <input
            name="phone"
            placeholder="Phone number"
            className="h-10 w-full rounded-md border border-[#0A4D3C]/20 px-3 text-sm"
          />
        </div>
        <p className="text-xs text-slate-400">Provide either email or phone.</p>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="bg-[#0A4D3C] hover:bg-[#0A4D3C]/90">
          {loading ? "Searching…" : "Track Order"}
        </Button>
      </form>

      {order && (
        <div className="space-y-4 border-t border-[#0A4D3C]/10 pt-5">
          {/* Order header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-[#0A4D3C]">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">
                Placed {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Rs. {Number(order.totalAmount).toFixed(2)}</p>
              <p className="text-xs text-slate-500">{order.paymentStatus}</p>
            </div>
          </div>

          {/* Order timeline */}
          {order.orderStatus !== "CANCELLED" ? (
            <div className="grid grid-cols-5 gap-1">
              {STATUS_STEPS.map((step, i) => {
                const currentIdx = STATUS_STEPS.indexOf(order.orderStatus);
                const active = i <= currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div
                      className={`h-2 w-full rounded-full ${
                        active ? "bg-[#0A4D3C]" : "bg-slate-200"
                      }`}
                    />
                    <span
                      className={`text-center text-[10px] leading-tight ${
                        active ? "font-medium text-[#0A4D3C]" : "text-slate-400"
                      }`}
                    >
                      {step.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              Order Cancelled
            </div>
          )}

          {/* Shipment info */}
          {order.shipment ? (
            <div className="rounded-lg border border-[#0A4D3C]/10 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                {STATUS_ICON[order.shipment.status] ?? <Truck className="h-4 w-4 text-slate-500" />}
                <span className="font-medium text-sm">
                  {order.shipment.status.replace(/_/g, " ")}
                </span>
                {order.shipment.courierName && (
                  <span className="text-xs text-slate-500">via {order.shipment.courierName}</span>
                )}
              </div>
              {order.shipment.awbCode && (
                <p className="text-xs text-slate-600">
                  AWB: <span className="font-mono">{order.shipment.awbCode}</span>
                </p>
              )}
              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-[#0A4D3C] hover:underline"
                >
                  Track on courier website ↗
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[#0A4D3C]/10 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              Shipment not dispatched yet
            </div>
          )}

          {/* Live tracking activities */}
          {activities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#0A4D3C]">Tracking History</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-lg border border-[#0A4D3C]/8 bg-white p-3 text-xs"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#0A4D3C]" />
                    <div>
                      <p className="font-medium text-slate-800">
                        {a["sr-status-label"] ?? a.activity ?? "Update"}
                      </p>
                      {a.location && (
                        <p className="text-slate-500">{a.location}</p>
                      )}
                      {a.date && (
                        <p className="text-slate-400">{a.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0A4D3C]">Items</p>
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[#0A4D3C]/8 bg-white px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.productTitle}</span>
                  <span className="text-slate-400">× {item.quantity}</span>
                </div>
                <span className="font-medium">
                  Rs. {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
