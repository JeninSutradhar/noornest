import { createCouponAction, deleteCouponAction } from "@/app/admin/resource-actions";
import { adminApi } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminCouponsPage() {
  const coupons = await adminApi<
    Array<{ id: string; code: string; type: string; usedCount: number }>
  >("/api/admin/coupons");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">Coupons</h1>
      <section className="lux-card rounded-xl p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#0A4D3C]">Create Coupon</h2>
        <form action={createCouponAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="Code" required />
          <Input name="type" defaultValue="PERCENTAGE" placeholder="Type" required />
          <Input name="value" type="number" step="0.01" placeholder="Value" required />
          <Input name="scope" defaultValue="ALL" placeholder="Scope" />
          <Input name="startDate" type="datetime-local" required />
          <Input name="expiryDate" type="datetime-local" required />
          <Input name="minimumCartValue" type="number" step="0.01" placeholder="Min cart value" />
          <Input name="maxDiscountAmount" type="number" step="0.01" placeholder="Max discount" />
          <Input name="usageLimitPerUser" type="number" placeholder="Per user limit" />
          <Input name="usageLimitTotal" type="number" placeholder="Total usage limit" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="status" defaultChecked /> Active</label>
          <Button type="submit">Create</Button>
        </form>
      </section>
      <section className="lux-card rounded-xl p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#0A4D3C]">Usage Tracking</h2>
        <div className="space-y-2 text-sm">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between rounded-md border border-[#0A4D3C]/10 p-3">
              <span>
                {coupon.code} • {coupon.type} • Used {coupon.usedCount}
              </span>
              <form action={deleteCouponAction}>
                <input type="hidden" name="id" value={coupon.id} />
                <button className="text-red-600">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
