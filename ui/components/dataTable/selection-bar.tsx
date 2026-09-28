"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Button } from "../button";
import type { BulkSelection, TableSelection } from "@/types/DataTable";

interface SelectionBarProps {
  selection: TableSelection;
  /** Rows the current filters match on the server, across every page. */
  total: number;
  allMatching: boolean;
  onSelectAllMatching: () => void;
  onClear: () => void;
  filters: Record<string, unknown>;
  actions: (selection: BulkSelection) => React.ReactNode;
}

/**
 * The strip that appears above a table once rows are ticked: how many are
 * selected, the Gmail-style "select all N matching" offer, and the bulk
 * actions the page supplies.
 *
 * The offer appears only when the whole page is ticked and the filter matches
 * more rows than the page holds — that is the one moment "all" is ambiguous
 * between "these 48" and "all 200".
 */
export function SelectionBar({
  selection,
  total,
  allMatching,
  onSelectAllMatching,
  onClear,
  filters,
  actions,
}: SelectionBarProps) {
  const t = useTranslations("common.table");
  if (!allMatching && selection.count === 0) return null;

  const offerAll =
    !allMatching && selection.pageAllSelected && total > selection.pageRowCount;
  const count = allMatching ? total : selection.count;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <span className="font-medium">
        {allMatching ? t("allMatchingSelected", { count }) : t("selectedCount", { count })}
      </span>
      {offerAll && (
        <Button variant="link" size="sm" className="h-auto p-0" onClick={onSelectAllMatching}>
          {t("selectAllMatching", { count: total })}
        </Button>
      )}
      <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={onClear}>
        {t("clearSelection")}
      </Button>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {actions({
          ids: allMatching ? [] : selection.ids,
          allMatching,
          count,
          filters,
          clear: onClear,
        })}
      </div>
    </div>
  );
}
