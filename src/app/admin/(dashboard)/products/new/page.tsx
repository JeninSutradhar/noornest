import { adminApi } from "@/lib/admin-api";
import { ProductEditor } from "@/components/admin/product-editor";

type ApiCategory = { id: string; name: string; parentId: string | null };

export default async function NewAdminProductPage() {
  const raw = await adminApi<ApiCategory[]>("/api/admin/categories");
  const categories = raw.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? null,
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#0A4D3C]">Create product</h1>
      <div className="lux-card rounded-xl p-5 sm:p-6">
        <ProductEditor categories={categories} />
      </div>
    </div>
  );
}
