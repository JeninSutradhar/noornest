import Link from "next/link";

import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = query.token || "";

  return (
    <div className="islamic-pattern mx-auto w-full max-w-md rounded-2xl border border-[#0A4D3C]/10 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">Reset Password</h1>
      <p className="mt-1 text-sm text-slate-600">Create a new password for your account.</p>
      {query.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {query.error}
        </p>
      )}
      {!token ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Missing or invalid reset token. Request a new link.
        </div>
      ) : (
        <form action={resetPasswordAction} className="mt-4 space-y-3">
          <input type="hidden" name="token" value={token} />
          <Input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="New password"
            className="h-11"
          />
          <Input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="Confirm new password"
            className="h-11"
          />
          <Button type="submit" className="h-11 w-full">
            Update Password
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">
        Back to <Link href="/login" className="text-[#0A4D3C]">Login</Link>
      </p>
    </div>
  );
}
