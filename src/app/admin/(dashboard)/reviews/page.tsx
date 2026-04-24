import { patchReviewStatusAction } from "@/app/admin/resource-actions";
import { adminApi } from "@/lib/admin-api";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; productId?: string }>;
}) {
  const query = await searchParams;
  const status = query.status ? `&status=${encodeURIComponent(query.status)}` : "";
  const productId = query.productId ? `&productId=${encodeURIComponent(query.productId)}` : "";
  const reviews = await adminApi<{
    items: Array<{
      id: string;
      status: string;
      title?: string | null;
      comment?: string | null;
      rating: number;
      productId: string;
      product?: { title?: string | null } | null;
    }>;
  }>(
    `/api/admin/reviews?pageSize=100${status}${productId}`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">Reviews & Ratings</h1>
      <form className="lux-card grid gap-3 rounded-xl p-4 md:grid-cols-3">
        <input name="status" defaultValue={query.status || ""} className="h-10 rounded-md border border-[#0A4D3C]/20 px-3 text-sm" placeholder="Status" />
        <input name="productId" defaultValue={query.productId || ""} className="h-10 rounded-md border border-[#0A4D3C]/20 px-3 text-sm" placeholder="Product ID" />
        <button className="rounded-md bg-[#0A4D3C] px-3 text-sm text-white">Apply</button>
      </form>
      <div className="space-y-3">
        {reviews.items.map((review) => (
          <article key={review.id} className="lux-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0A4D3C]">{review.product?.title || review.productId}</p>
              <span className="text-xs text-slate-500">{review.status}</span>
            </div>
            <p className="text-sm text-slate-700">{review.title || "No title"} • {review.rating}/5</p>
            <p className="mt-1 text-sm text-slate-600">{review.comment || "-"}</p>
            <div className="mt-2 flex gap-2">
              {["APPROVED", "REJECTED", "PENDING"].map((nextStatus) => (
                <form key={nextStatus} action={patchReviewStatusAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="status" value={nextStatus} />
                  <button className="rounded border border-[#0A4D3C]/20 px-2 py-1 text-xs text-[#0A4D3C]">
                    {nextStatus}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
