import Link from "next/link";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="islamic-pattern mx-auto w-full max-w-md rounded-2xl border border-[#0A4D3C]/10 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">Welcome Back</h1>
      <p className="mt-1 text-sm text-slate-500">Login to manage your NoorNest account.</p>
      {query.message && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {query.message}
        </p>
      )}
      {query.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {query.error}
        </p>
      )}
      <form action={loginAction} className="mt-4 space-y-3">
        <input type="hidden" name="next" value={query.next || "/account"} />
        <Input name="email" type="email" required placeholder="Email address" className="h-11" />
        <Input name="password" type="password" required placeholder="Password" className="h-11" />
        <Button type="submit" className="h-11 w-full">
          Sign In
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New here? <Link href="/register" className="text-[#0A4D3C]">Create account</Link>
      </p>
      <p className="text-sm text-slate-600">
        <Link href="/forgot-password" className="text-[#0A4D3C]">Forgot password?</Link>
      </p>
    </div>
  );
}
