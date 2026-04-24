import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { isAdminAuthenticated } from "@/lib/admin-session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1920px] grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-8">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-col">
          <AdminTopbar />
          {children}
        </div>
      </div>
    </div>
  );
}
