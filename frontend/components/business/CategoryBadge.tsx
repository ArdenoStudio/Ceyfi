"use client";

interface CategoryBadgeProps {
  categoryEn: string;
  categorySi?: string;
}

const COLOUR_MAP: Record<string, string> = {
  INCOME: "bg-emerald-100 text-emerald-700",
  SUPPLIER: "bg-orange-100 text-orange-700",
  UTILITIES: "bg-blue-100 text-blue-700",
  WAGES: "bg-violet-100 text-violet-700",
  RENT: "bg-red-100 text-red-700",
  TRANSPORT: "bg-amber-100 text-amber-700",
  MISC: "bg-slate-100 text-slate-700",
};

export function CategoryBadge({ categoryEn, categorySi }: CategoryBadgeProps) {
  const colour = COLOUR_MAP[categoryEn.toUpperCase()] ?? COLOUR_MAP.MISC;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${colour}`}>
      <span>{categoryEn}</span>
      {categorySi && <span className="sinhala">{categorySi}</span>}
    </span>
  );
}
