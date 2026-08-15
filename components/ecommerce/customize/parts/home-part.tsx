"use client";
// coding-standard: maintained

import { Pencil } from "lucide-react";
import { Button } from "@/ui/components/button";
import {
  PartBlock,
  PartHint,
} from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import {
  homeRowDefaultTitle,
  homeRowSummary,
} from "@/components/ecommerce/customize/home-row-labels";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Home page — the layout, then the product rows shown under it.
 *
 * The two belong in one part because they are one decision with two halves: the
 * layout says how the homepage is composed, the rows say what a shopper
 * actually finds on it. The layout choice also changes how many rows are used,
 * which is why that consequence is stated here rather than left to be
 * discovered — **Classic renders every row; Hero Split and Minimal are
 * single-row layouts and show the first one only.**
 */
export function HomePart({
  draft,
  patchTemplate,
  onManageRows,
}: {
  onManageRows: () => void;
} & Pick<CustomizeDraftApi, "draft" | "patchTemplate">) {
  const rows = draft.homeRows;
  const singleRow = draft.templates.home !== "classic";

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="home"
          value={draft.templates.home}
          onChange={(v) => patchTemplate("home", v)}
        />
      </PartBlock>

      <PartBlock
        label="Product rows"
        hint={
          singleRow
            ? "This layout shows one row of products, so only the first row below appears."
            : "Rows appear under the hero, in this order."
        }
      >
        {rows.length === 0 ? (
          <PartHint>
            No product rows — the homepage shows the hero and collections only.
          </PartHint>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className="flex items-center gap-2.5 border-b p-2 text-sm last:border-0"
              >
                <span className="w-3 flex-none text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {row.title?.trim() || homeRowDefaultTitle(row, draft.collections)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {homeRowSummary(row, draft.collections)}
                  </span>
                </span>
                {/* A layout that renders one row must say which rows are inert,
                    or the list below the first reads as broken rather than as
                    unused by the chosen layout. */}
                {singleRow && i > 0 ? (
                  <span className="flex-none text-xs text-muted-foreground">
                    not shown
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onManageRows}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Add, reorder or edit rows
        </Button>
      </PartBlock>
    </>
  );
}
