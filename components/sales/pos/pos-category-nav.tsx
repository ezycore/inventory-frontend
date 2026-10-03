"use client";
// coding-standard: maintained
import { LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { cn } from "@ui/lib/utils";
import type { PosCategory } from "./pos-catalog";

/** "All products" in the nav. */
export const ALL_CATEGORIES = "__all";

/** A category's face: a photo from inside it, else its initial. */
function CategoryMark({ category, active }: { category?: PosCategory; active: boolean }) {
  return (
    <Avatar className={cn("size-7 shrink-0 rounded-md", active && "ring-2 ring-primary/40")}>
      {category?.photo ? <AvatarImage src={category.photo} alt="" className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "rounded-md text-xs font-semibold",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {category ? category.name.slice(0, 1).toUpperCase() : <LayoutGrid className="size-3.5" />}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * The browser's categories, in two shapes chosen by the BROWSER's own width
 * (container query, not the screen's), so it adapts the same way on a phone, a
 * 1366 px counter and a wide monitor: a vertical `rail` with names and counts
 * where there is room, a row of `chips` where there is not. The browser renders
 * both; CSS shows one.
 */
export function PosCategoryNav({
  variant,
  categories,
  total,
  selected,
  onSelect,
}: {
  variant: "rail" | "chips";
  categories: PosCategory[];
  total: number;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("sales.pos.browse");
  const entries: { id: string; name: string; count: number; category?: PosCategory }[] = [
    { id: ALL_CATEGORIES, name: t("allProducts"), count: total },
    ...categories.map((c) => ({ id: c.id, name: c.name, count: c.count, category: c })),
  ];

  if (variant === "rail") {
    return (
      <nav
        aria-label={t("categories")}
        className="hidden w-48 shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-muted/30 p-1.5 @2xl:flex @4xl:w-56"
      >
        {entries.map((entry) => {
          const active = selected === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              title={entry.name}
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(entry.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                active
                  ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]"
                  : "hover:bg-muted",
              )}
            >
              <CategoryMark category={entry.category} active={active} />
              <span className="line-clamp-2 min-w-0 flex-1 leading-tight">{entry.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{entry.count}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={t("categories")}
      className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pb-1 pt-3 [scrollbar-width:none] @2xl:hidden"
    >
      {entries.map((entry) => {
        const active = selected === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(entry.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full border pl-1 pr-3 text-sm font-medium whitespace-nowrap",
              active ? "border-primary bg-primary/10 text-primary" : "bg-card",
            )}
          >
            <CategoryMark category={entry.category} active={active} />
            {entry.name}
          </button>
        );
      })}
    </div>
  );
}
