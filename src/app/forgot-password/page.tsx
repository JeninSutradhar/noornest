import Link from "next/link";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const query = await searchParams;
  const sent = query.sent === "1";
  return (
    <div className="islamic-pattern mx-auto w-full max-w-md rounded-2xl border border-[#0A4D3C]/10 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">Forgot Password</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your email and we will generate a secure reset link.
      </p>
      {query.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {query.error}
        </p>
      )}
      {sent && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          If this email exists, a reset link has been generated. Check server logs in dev mode.
        </p>
      )}
      <form action={requestPasswordResetAction} className="mt-4 space-y-3">
        <Input name="email" type="email" required placeholder="Email address" className="h-11" />
        <Button type="submit" className="h-11 w-full">
          Send Reset Link
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Back to <Link href="/login" className="text-[#0A4D3C]">Login</Link>
      </p>
    </div>
  );
}
