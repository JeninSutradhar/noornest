import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountAddressesPage() {
  const user = await requireUserOrRedirect("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">My Addresses</h1>

      <section className="lux-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[#0A4D3C]">Add New Address</h2>
        <form action={createAddressAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Input name="fullName" placeholder="Full name" required />
          <Input name="phone" placeholder="Phone" required />
          <Input name="email" type="email" placeholder="Email (optional)" />
          <select
            name="type"
            defaultValue="HOME"
            className="h-10 rounded-md border border-[#0A4D3C]/20 bg-white px-3 text-sm"
          >
            <option value="HOME">Home</option>
            <option value="OFFICE">Office</option>
            <option value="OTHER">Other</option>
          </select>
          <div className="md:col-span-2">
            <Input name="line1" placeholder="Address line 1" required />
          </div>
          <div className="md:col-span-2">
            <Input name="line2" placeholder="Address line 2 (optional)" />
          </div>
          <Input name="landmark" placeholder="Landmark (optional)" />
          <Input name="postalCode" placeholder="Postal code" required />
          <Input name="city" placeholder="City" required />
          <Input name="state" placeholder="State" required />
          <Input name="country" defaultValue="India" placeholder="Country" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isDefault" />
            Set as default address
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Add Address</Button>
          </div>
        </form>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className="lux-card rounded-xl p-4">
            <p className="font-semibold text-[#0A4D3C]">
              {address.fullName} {address.isDefault ? "(Default)" : ""}
            </p>
            <p className="text-sm text-slate-600">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
              {address.postalCode}
            </p>
            <p className="text-sm text-slate-500">{address.phone}</p>
            <div className="mt-3 flex gap-2">
              {!address.isDefault && (
                <form action={setDefaultAddressAction}>
                  <input type="hidden" name="id" value={address.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Make default
                  </Button>
                </form>
              )}
              <form action={deleteAddressAction}>
                <input type="hidden" name="id" value={address.id} />
                <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                  Delete
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
