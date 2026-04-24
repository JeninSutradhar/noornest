import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#0A4D3C]/10 text-[#0A4D3C]",
        className,
      )}
    >
      {children}
    </span>
  );
}
