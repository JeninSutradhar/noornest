import { adminLoginAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="islamic-pattern mx-auto w-full max-w-md rounded-2xl border border-[#0A4D3C]/10 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">Admin Login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Use the value of ADMIN_API_KEY from your environment file. Store customers sign in at{" "}
        <a href="/login" className="text-[#0A4D3C] underline">
          /login
        </a>{" "}
        (that flow goes to My Account, not here).
      </p>
      {query.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {query.error}
        </p>
      )}
      <form action={adminLoginAction} className="mt-4 space-y-3">
        <Input name="apiKey" type="password" required placeholder="Admin API key" className="h-11" />
        <Button type="submit" className="h-11 w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}
