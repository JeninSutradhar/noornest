"use client";

import { useState } from "react";
import { Truck, Package, Tag, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShipmentActionsProps = {
  orderId: string;
  adminKey: string;
  shipment?: {
    status?: string | null;
    awbCode?: string | null;
    courierName?: string | null;
    trackingUrl?: string | null;
    shiprocketShipmentId?: string | null;
    pickupRequested?: boolean;
  } | null;
};

type ActionResult = {
  labelUrl?: string | null;
  manifestUrl?: string | null;
  pickupScheduledDate?: string | null;
  error?: string;
};

export function ShipmentActions({ orderId, adminKey, shipment }: ShipmentActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callAction(
    endpoint: string,
    actionKey: string,
    method = "POST",
  ) {
    setLoading(actionKey);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": adminKey,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Action failed");
      } else {
        setResult(json.data ?? json);
        // Reload to reflect updated shipment state
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  const hasShipment = Boolean(shipment?.shiprocketShipmentId);
  const hasAWB = Boolean(shipment?.awbCode);
  const pickupDone = Boolean(shipment?.pickupRequested);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">
        Shipment Actions
      </h3>

      <div className="flex flex-wrap gap-2">
        {/* Create shipment */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null || hasShipment}
          onClick={() => callAction("create-shipment", "create")}
          className="gap-1.5"
        >
          <Package className="h-3.5 w-3.5" />
          {loading === "create" ? "Creating…" : "Create Shipment"}
        </Button>

        {/* Assign AWB */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null || !hasShipment || hasAWB}
          onClick={() => callAction("assign-awb", "awb")}
          className="gap-1.5"
        >
          <Tag className="h-3.5 w-3.5" />
          {loading === "awb" ? "Assigning…" : "Assign AWB"}
        </Button>

        {/* Request pickup */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null || !hasAWB || pickupDone}
          onClick={() => callAction("request-pickup", "pickup")}
          className="gap-1.5"
        >
          <Truck className="h-3.5 w-3.5" />
          {loading === "pickup" ? "Scheduling…" : "Request Pickup"}
        </Button>

        {/* Generate label */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null || !hasShipment}
          onClick={() => callAction("generate-label", "label")}
          className="gap-1.5"
        >
          <Tag className="h-3.5 w-3.5" />
          {loading === "label" ? "Generating…" : "Print Label"}
        </Button>

        {/* Sync tracking */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null || !hasAWB}
          onClick={() => callAction("sync-tracking", "sync")}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {loading === "sync" ? "Syncing…" : "Sync Tracking"}
        </Button>

        {/* Cancel shipment */}
        {hasShipment && shipment?.status !== "DELIVERED" && shipment?.status !== "CANCELLED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => {
              if (confirm("Cancel this shipment? This cannot be undone.")) {
                callAction("cancel-shipment", "cancel");
              }
            }}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            {loading === "cancel" ? "Cancelling…" : "Cancel Shipment"}
          </Button>
        )}
      </div>

      {/* Status info */}
      {shipment && (
        <div className="rounded-lg border border-[#0A4D3C]/10 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p>Status: <span className="font-medium">{shipment.status}</span></p>
          {shipment.awbCode && <p>AWB: <span className="font-medium">{shipment.awbCode}</span></p>}
          {shipment.courierName && <p>Courier: <span className="font-medium">{shipment.courierName}</span></p>}
          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#0A4D3C] underline"
            >
              Track shipment ↗
            </a>
          )}
        </div>
      )}

      {/* Result feedback */}
      {result?.labelUrl && (
        <a
          href={result.labelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-md bg-[#0A4D3C] px-3 py-1.5 text-xs text-white"
        >
          Open Label PDF ↗
        </a>
      )}
      {result?.pickupScheduledDate && (
        <p className="text-xs text-green-700">
          Pickup scheduled: {result.pickupScheduledDate}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
