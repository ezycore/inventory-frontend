// coding-standard: maintained
"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/services/api";
import { FuseAdvancedSelect } from "@ui/components/fuse-advanced-select";
import { Card, CardContent } from "@ui/components/card";
import { Package } from "lucide-react";

/** Product/variant (+ optional location) scope applied to the movements list. */
export interface MovementScope {
  productId?: string;
  variantId?: string;
  locationId?: string;
}

interface InventoryScopeFilterProps {
  value: MovementScope;
  onChange: (scope: MovementScope) => void;
}

/**
 * Fuzzy "inventory" filter for the movements page. Options are the active
 * location's inventory rows (product · variant); picking one scopes the table to
 * that product/variant. Reflects an externally-set scope (e.g. a deep link from a
 * detail page) by matching a row on productId + variantId.
 */
export function InventoryScopeFilter({ value, onChange }: InventoryScopeFilterProps) {
  const t = useTranslations("inventory.movements");
  const { data } = useQuery({
    queryKey: ["inventory", "scope-options"],
    queryFn: () => inventoryApi.getAll({ limit: 1000 }),
    select: (res) => res.data?.items ?? [],
    staleTime: 5 * 60 * 1000,
  });
  // Memoized so the derived useMemos below don't recompute on every render.
  const rows: any[] = useMemo(() => data ?? [], [data]);

  const { options, byId } = useMemo(() => {
    const byId = new Map<string, MovementScope>();
    const options = rows.map((r) => {
      const attrs = r.attributes ? Object.values(r.attributes).join(" / ") : "";
      byId.set(r._id, { productId: r.productId, variantId: r.variantId || undefined });
      return { value: r._id, label: attrs ? `${r.name} · ${attrs}` : r.name };
    });
    return { options, byId };
  }, [rows]);

  // Map the active scope back to a row id so the control shows the current filter.
  const selectedId = useMemo(() => {
    if (!value.productId) return "";
    const match = rows.find(
      (r) => r.productId === value.productId && (r.variantId || undefined) === value.variantId,
    );
    return match?._id ?? "";
  }, [rows, value]);

  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
        <FuseAdvancedSelect
          className="w-full"
          placeholder={t("scopePlaceholder")}
          options={options}
          value={selectedId}
          onValueChange={(v) => {
            const id = typeof v === "string" ? v : "";
            onChange(id ? byId.get(id) ?? {} : {});
          }}
        />
      </CardContent>
    </Card>
  );
}
