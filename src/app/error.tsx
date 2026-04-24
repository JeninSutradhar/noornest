"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center">
      <h2 className="text-xl font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">Please try again.</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
