import Link from "next/link";

import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountReviewsPage() {
  const user = await requireUserOrRedirect("/account/reviews");
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">My Reviews</h1>
      {reviews.length === 0 && (
        <div className="rounded-xl border border-[#0A4D3C]/10 bg-white p-6 text-sm text-slate-500">
          You have not written any reviews yet.
        </div>
      )}
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-[#0A4D3C]/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#0A4D3C]">{review.product.title}</p>
            <span className="text-xs text-slate-500">{review.status}</span>
          </div>
          <p className="text-sm text-slate-600">{review.comment}</p>
          <Link href={`/product/${review.product.slug}`} className="mt-2 inline-block text-sm text-[#0A4D3C]">
            View product
          </Link>
        </article>
      ))}
    </div>
  );
}
