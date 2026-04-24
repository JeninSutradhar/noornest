import Link from "next/link";

import { adminApi } from "@/lib/admin-api";
import { AdminSettingsEditor, type SettingRow } from "@/components/admin/settings-editor";
import { cn } from "@/lib/utils";

const groups = ["general", "payment", "shipping", "tax", "seo"] as const;

const GROUP_LABELS: Record<(typeof groups)[number], string> = {
  general: "General",
  payment: "Payment",
  shipping: "Shipping",
  tax: "Tax",
  seo: "SEO",
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupKey?: string }>;
}) {
  const query = await searchParams;
  const raw = query.groupKey || "general";
  const active = (groups.includes(raw as (typeof groups)[number]) ? raw : "general") as (typeof groups)[number];
  const entries: SettingRow[] =
    active === "general"
      ? []
      : await adminApi<
          Array<{ groupKey: string; key: string; valueType: string; valueJson: unknown; isEncrypted: boolean }>
        >(`/api/admin/settings?groupKey=${active}`).then((list) =>
          list.map((e) => ({
            key: e.key,
            valueType: e.valueType as SettingRow["valueType"],
            valueJson: e.valueJson,
            isEncrypted: e.isEncrypted,
          })),
        );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Configure store defaults stored in the database. Payment, shipping, tax, and SEO each have their own group
          of typed keys — no hand-editing raw JSON in production unless a field is explicitly JSON.
        </p>
      </div>

      <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <Link
            key={group}
            href={group === "general" ? "/admin/settings" : `/admin/settings?groupKey=${group}`}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              group === active
                ? "bg-[#0A4D3C] text-white shadow-sm"
                : "border border-[#0A4D3C]/20 bg-white text-[#0A4D3C] shadow-sm hover:bg-[#0A4D3C]/6",
            )}
          >
            {GROUP_LABELS[group]}
          </Link>
        ))}
      </nav>

      <section className="lux-card rounded-xl p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0A4D3C]">
          {GROUP_LABELS[active]}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {active === "general"
            ? "Start with the area you need below. Each tab loads keys from the AdminSetting table for that group."
            : `Editing ${GROUP_LABELS[active].toLowerCase()} keys. Changes apply after you save.`}
        </p>

        {active === "general" ? (
          <div className="mt-6 rounded-xl border border-[#0A4D3C]/12 bg-gradient-to-br from-[#0A4D3C]/6 via-white to-[#C9A227]/8 p-6">
            <p className="text-sm font-medium text-[#0A4D3C]">Choose a category</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Razorpay keys and callbacks live under <strong>Payment</strong>. Couriers and fulfillment defaults under{" "}
              <strong>Shipping</strong>. GST or regional rules under <strong>Tax</strong>. Storefront meta defaults
              under <strong>SEO</strong>.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {groups
                .filter((g) => g !== "general")
                .map((g) => (
                  <li key={g}>
                    <Link
                      href={`/admin/settings?groupKey=${g}`}
                      className="inline-flex rounded-lg border border-[#0A4D3C]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#0A4D3C] shadow-sm hover:bg-[#0A4D3C]/5"
                    >
                      Open {GROUP_LABELS[g]}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6">
            <AdminSettingsEditor groupKey={active} entries={entries} />
          </div>
        )}
      </section>
    </div>
  );
}
