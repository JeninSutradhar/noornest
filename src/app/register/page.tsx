import Link from "next/link";

import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="islamic-pattern mx-auto w-full max-w-md rounded-2xl border border-[#0A4D3C]/10 bg-white p-7 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">Create Account</h1>
      <p className="mt-1 text-sm text-slate-500">Start your premium Islamic shopping journey.</p>
      {query.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {query.error}
        </p>
      )}
      <form action={registerAction} className="mt-4 space-y-3">
        <Input name="name" required placeholder="Full name" className="h-11" />
        <Input name="email" type="email" required placeholder="Email address" className="h-11" />
        <Input name="phone" required placeholder="Phone number" className="h-11" />
        <Input name="password" type="password" required placeholder="Password (min 6 chars)" className="h-11" />
        <Button type="submit" className="h-11 w-full">
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link href="/login" className="text-[#0A4D3C]">Login</Link>
      </p>
    </div>
  );
}
