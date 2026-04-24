"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ max }: { max: number }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => setQty(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        className="flex h-11 w-11 items-center justify-center rounded-l-xl border border-r-0 border-[#0A4D3C]/20 bg-white text-[#0A4D3C] transition hover:bg-[#0A4D3C]/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        name="quantity"
        value={qty}
        min={1}
        max={max}
        readOnly
        className="h-11 w-14 border-y border-[#0A4D3C]/20 bg-white text-center text-base font-semibold text-slate-800 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setQty(Math.min(max, qty + 1))}
        disabled={qty >= max}
        className="flex h-11 w-11 items-center justify-center rounded-r-xl border border-l-0 border-[#0A4D3C]/20 bg-white text-[#0A4D3C] transition hover:bg-[#0A4D3C]/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
