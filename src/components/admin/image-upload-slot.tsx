"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type AdminImageUploadHandler = (formData: FormData) => Promise<{ url: string }>;

export function AdminImageUploadSlot({
  disabled,
  uploadAction,
  onUploaded,
  label = "Upload from computer",
}: {
  disabled?: boolean;
  uploadAction: AdminImageUploadHandler;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <label
        className={cn(
          "inline-flex w-fit cursor-pointer rounded-md border border-[#0A4D3C]/25 bg-white px-3 py-2 text-xs font-medium text-[#0A4D3C] shadow-sm transition hover:bg-[#0A4D3C]/5",
          (disabled || busy) && "pointer-events-none opacity-50",
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled || busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setUploadErr("");
            setBusy(true);
            try {
              const fd = new FormData();
              fd.set("file", f);
              const { url } = await uploadAction(fd);
              onUploaded(url);
            } catch (err) {
              setUploadErr(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
        {busy ? "Uploading…" : label}
      </label>
      {uploadErr ? <p className="text-xs text-red-600">{uploadErr}</p> : null}
    </div>
  );
}
