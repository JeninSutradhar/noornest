import { TrackOrderClient } from "@/components/store/track-order-client";

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-[#0A4D3C]/10 bg-white p-6">
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Track Your Order</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your order number and registered email or phone to track your shipment.
        </p>
        <TrackOrderClient />
      </div>
    </div>
  );
}
