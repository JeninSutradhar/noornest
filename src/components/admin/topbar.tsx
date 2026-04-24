import { adminLogoutAction } from "@/app/admin/actions";
import { getCurrentUser } from "@/lib/auth";

export async function AdminTopbar() {
  const user = await getCurrentUser();
  return (
    <div className="mb-5 flex items-center justify-between rounded-xl border border-[#0A4D3C]/10 bg-white px-4 py-3">
      <div>
        <p className="text-sm text-slate-500">Admin Panel</p>
        <p className="text-lg font-semibold text-[#0A4D3C]">Welcome, {user?.name || "Admin"}</p>
      </div>
      <form action={adminLogoutAction}>
        <button
          type="submit"
          className="rounded-lg border border-[#0A4D3C]/20 px-3 py-2 text-sm text-[#0A4D3C] hover:bg-[#0A4D3C]/5"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
