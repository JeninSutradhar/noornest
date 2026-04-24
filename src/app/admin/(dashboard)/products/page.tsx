import Link from "next/link";

import { deleteProductAction } from "@/app/admin/resource-actions";
import { adminApi } from "@/lib/admin-api";

type ProductsRes = {
  items: Array<{
    id: string;
    title: string;
    sku: string;
    status: string;
    stockQuantity: number;
    regularPrice: string | number;
    featured: boolean;
    images?: Array<{ imageUrl: string; isFeatured?: boolean; sortOrder?: number }>;
  }>;
};

function pickListThumb(images?: ProductsRes["items"][number]["images"]) {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const featured = sorted.find((i) => i.isFeatured);
  return (featured ?? sorted[0])?.imageUrl?.trim() || null;
}

export default async function AdminProductsPage() {
  const data = await adminApi<ProductsRes>("/api/admin/products?pageSize=100");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0A4D3C]">Products</h1>
        <Link href="/admin/products/new" className="rounded-lg bg-[#0A4D3C] px-3 py-2 text-sm text-white">
          Add Product
        </Link>
      </div>
      <div className="lux-card rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-14 py-2 pr-2"> </th>
                <th className="py-2">Title</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Status</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Price</th>
                <th className="py-2">Featured</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const thumb = pickListThumb(item.images);
                return (
                <tr key={item.id} className="border-t border-[#0A4D3C]/8">
                  <td className="py-2 pr-2 align-middle">
                    {thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- admin list thumbnails */
                      <img
                        src={thumb}
                        alt=""
                        className="h-10 w-10 rounded-md border border-[#0A4D3C]/12 object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-[#0A4D3C]/20 bg-slate-50 text-[10px] text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                  <td className="py-2 font-medium text-slate-800">{item.title}</td>
                  <td className="py-2">{item.sku}</td>
                  <td className="py-2">{item.status}</td>
                  <td className="py-2">{item.stockQuantity}</td>
                  <td className="py-2">Rs. {Number(item.regularPrice).toFixed(2)}</td>
                  <td className="py-2">{item.featured ? "Yes" : "No"}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${item.id}`} className="text-[#0A4D3C]">
                        Edit
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-red-600">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
