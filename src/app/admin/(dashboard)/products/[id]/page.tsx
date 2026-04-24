import { adminApi } from "@/lib/admin-api";
import { ProductEditor } from "@/components/admin/product-editor";

type ApiCategory = { id: string; name: string; parentId: string | null };

export default async function EditAdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, rawCats] = await Promise.all([
    adminApi<Record<string, unknown>>(`/api/admin/products/${id}`),
    adminApi<ApiCategory[]>("/api/admin/categories"),
  ]);
  const categories = rawCats.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? null,
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#0A4D3C]">Edit product</h1>
      <div className="lux-card rounded-xl p-5 sm:p-6">
        <ProductEditor product={product} categories={categories} />
      </div>
    </div>
  );
}
