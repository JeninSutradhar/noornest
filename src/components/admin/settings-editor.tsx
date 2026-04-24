"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveSettingsGroupAction } from "@/app/admin/resource-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SettingRow = {
  key: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "SECRET";
  valueJson: unknown;
  isEncrypted: boolean;
};

function serializeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "";
  }
}

function humanizeKey(key: string) {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const fieldLabel = "mb-1.5 block text-xs font-medium text-slate-600";

export function AdminSettingsEditor({
  groupKey,
  entries,
}: {
  groupKey: "payment" | "shipping" | "tax" | "seo";
  entries: SettingRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<SettingRow[]>(() =>
    entries.map((e) => ({
      ...e,
      isEncrypted: Boolean(e.isEncrypted),
    })),
  );
  const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      entries.filter((e) => e.valueType === "JSON").map((e) => [e.key, serializeJson(e.valueJson)]),
    ),
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function updateRow(key: string, patch: Partial<SettingRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError("");
    const payload: SettingRow[] = [];
    for (const row of rows) {
      let valueJson: unknown = row.valueJson;
      if (row.valueType === "NUMBER") {
        const n = Number(row.valueJson);
        if (!Number.isFinite(n)) {
          setError(`Invalid number for “${humanizeKey(row.key)}”`);
          return;
        }
        valueJson = n;
      }
      if (row.valueType === "BOOLEAN") {
        valueJson = Boolean(row.valueJson);
      }
      if (row.valueType === "STRING" || row.valueType === "SECRET") {
        valueJson = String(row.valueJson ?? "");
      }
      if (row.valueType === "JSON") {
        const raw = jsonDrafts[row.key] ?? "";
        try {
          valueJson = raw.trim() === "" ? null : JSON.parse(raw);
        } catch {
          setError(`Invalid JSON for “${humanizeKey(row.key)}”`);
          return;
        }
      }
      payload.push({
        key: row.key,
        valueType: row.valueType,
        valueJson,
        isEncrypted: row.isEncrypted,
      });
    }

    startTransition(async () => {
      try {
        await saveSettingsGroupAction(groupKey, payload);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#0A4D3C]/20 bg-slate-50/80 px-5 py-8 text-center">
        <p className="text-sm font-medium text-slate-800">No settings in this group</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Seed or insert rows in the <code className="rounded bg-white px-1 text-xs">AdminSetting</code> table for{" "}
          <span className="font-medium text-[#0A4D3C]">{groupKey}</span> — they will show up here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-[#0A4D3C]/10 bg-white/90 p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-[#0A4D3C]/8 pb-3">
              <div>
                <p className="font-medium text-slate-900">{humanizeKey(row.key)}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{row.key}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  row.valueType === "SECRET"
                    ? "bg-amber-50 text-amber-900 ring-amber-200"
                    : row.valueType === "JSON"
                      ? "bg-violet-50 text-violet-900 ring-violet-200"
                      : "bg-[#0A4D3C]/10 text-[#0A4D3C] ring-[#0A4D3C]/15",
                )}
              >
                {row.valueType}
              </span>
            </div>

            {row.valueType === "BOOLEAN" && (
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#0A4D3C]/30 text-[#0A4D3C]"
                  checked={Boolean(row.valueJson)}
                  onChange={(e) => updateRow(row.key, { valueJson: e.target.checked })}
                />
                Enabled
              </label>
            )}

            {row.valueType === "NUMBER" && (
              <div>
                <label className={fieldLabel}>Value</label>
                <Input
                  type="number"
                  step="any"
                  value={row.valueJson === null || row.valueJson === undefined ? "" : String(row.valueJson)}
                  onChange={(e) => updateRow(row.key, { valueJson: e.target.value })}
                />
              </div>
            )}

            {(row.valueType === "STRING" || row.valueType === "SECRET") && (
              <div>
                <label className={fieldLabel}>{row.valueType === "SECRET" ? "Secret value" : "Value"}</label>
                <Input
                  type={row.valueType === "SECRET" ? "password" : "text"}
                  autoComplete={row.valueType === "SECRET" ? "off" : undefined}
                  value={row.valueJson == null ? "" : String(row.valueJson)}
                  onChange={(e) => updateRow(row.key, { valueJson: e.target.value })}
                />
                {row.valueType === "SECRET" ? (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Stored carefully; use the encrypted-at-rest option below for API keys when supported.
                  </p>
                ) : null}
              </div>
            )}

            {row.valueType === "JSON" && (
              <div>
                <label className={fieldLabel}>JSON</label>
                <textarea
                  className="min-h-40 w-full rounded-md border border-[#0A4D3C]/20 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D3C]/40"
                  spellCheck={false}
                  value={jsonDrafts[row.key] ?? serializeJson(row.valueJson)}
                  onChange={(e) =>
                    setJsonDrafts((d) => ({
                      ...d,
                      [row.key]: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-[#0A4D3C]/8 pt-4 text-xs text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#0A4D3C]/30"
                checked={row.isEncrypted}
                onChange={(e) => updateRow(row.key, { isEncrypted: e.target.checked })}
              />
              Encrypt at rest (recommended for secrets)
            </label>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#0A4D3C]/10 pt-6">
        <Button type="button" onClick={submit} disabled={pending} className="min-w-[140px]">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
