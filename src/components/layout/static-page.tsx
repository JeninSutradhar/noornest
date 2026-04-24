export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-[#0A4D3C]/10 bg-white p-6">
      <h1 className="text-3xl font-semibold text-[#0A4D3C]">{title}</h1>
      <div className="prose mt-4 max-w-none text-slate-700">{children}</div>
    </div>
  );
}
