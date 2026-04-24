"use client";

import { useState } from "react";
import { Package, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = { orderIds: string[]; adminKey: string };

export function BulkShipmentActions({ orderIds, adminKey }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function bulkCreate() {
    setLoading("create");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/shipments/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": adminKey,
        },
        body: JSON.stringify({ orderIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Bulk create failed");
      } else {
        const d = json.data;
        setMessage(`Created ${d.succeeded}/${d.total} shipments`);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function generateManifest() {
    setLoading("manifest");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/shipments/generate-manifest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": adminKey,
        },
        body: JSON.stringify({ orderIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Manifest generation failed");
      } else {
        const url = json.data?.manifestUrl;
        if (url) {
          window.open(url, "_blank");
          setMessage("Manifest generated");
        } else {
          setMessage("Manifest requested — check Shiprocket dashboard");
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="lux-card flex flex-wrap items-center gap-3 rounded-xl p-4">
      <span className="text-sm font-medium text-slate-600">Bulk actions:</span>
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null || orderIds.length === 0}
        onClick={bulkCreate}
        className="gap-1.5"
      >
        <Package className="h-3.5 w-3.5" />
        {loading === "create" ? "Creating…" : "Create All Shipments"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null || orderIds.length === 0}
        onClick={generateManifest}
        className="gap-1.5"
      >
        <FileText className="h-3.5 w-3.5" />
        {loading === "manifest" ? "Generating…" : "Generate Manifest"}
      </Button>
      {message && <span className="text-sm text-green-700">{message}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
