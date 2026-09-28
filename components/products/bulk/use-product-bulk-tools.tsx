"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FolderInput, ListChecks, Sheet, Tag, TagsIcon } from "lucide-react";
import { Button } from "@/ui/components/button";
import type { CustomAction, BulkSelection } from "@/types/DataTable";
import type { ProductBulkTarget } from "@/services/api/modules/products/api";
import { BulkEditDialog } from "./bulk-edit-dialog";
import type { BulkOp } from "./bulk-action-fields";
import { toBulkTarget } from "./bulk-filter";
import { PasteListDialog } from "./paste-list-dialog";
import { TaxonomySheetDialog } from "./taxonomy-sheet-dialog";

interface EditorState {
  target: ProductBulkTarget;
  count: number;
  op: BulkOp;
  onDone?: () => void;
}

/**
 * Everything the products page needs for bulk taxonomy edits, as one hook:
 *  - `bulkActions` — the buttons in the table's selection bar;
 *  - `headerActions` — "Select from list" and the tags-and-categories sheet;
 *  - `dialogs` — rendered once by the page;
 *  - `onFiltersChange` — hand the table's filters in, so the sheet download
 *    covers the same products the merchant is looking at.
 */
export function useProductBulkTools(enabled: boolean) {
  const t = useTranslations("products.products.bulk");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const bulkActions = (selection: BulkSelection) => {
    const open = (op: BulkOp) =>
      setEditor({
        target: toBulkTarget(selection),
        count: selection.count,
        op,
        onDone: selection.clear,
      });
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => open("addTags")}>
          <Tag className="h-4 w-4" />
          {t("addTags")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => open("removeTags")}>
          <TagsIcon className="h-4 w-4" />
          {t("removeTags")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => open("setCategory")}>
          <FolderInput className="h-4 w-4" />
          {t("setCategory")}
        </Button>
      </>
    );
  };

  const headerActions: CustomAction[] = [
    {
      type: "select-from-list",
      placement: "header",
      label: t("fromList"),
      icon: <ListChecks className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setListOpen(true),
    },
    {
      type: "taxonomy-sheet",
      placement: "header",
      label: t("sheetButton"),
      icon: <Sheet className="h-4 w-4" />,
      variant: "outline",
      onClick: () => setSheetOpen(true),
    },
  ];

  const dialogs = (
    <>
      <PasteListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        onContinue={(ids) => setEditor({ target: { ids }, count: ids.length, op: "addTags" })}
      />
      {editor && (
        <BulkEditDialog
          open
          onOpenChange={(open) => !open && setEditor(null)}
          target={editor.target}
          count={editor.count}
          initialOp={editor.op}
          onDone={editor.onDone}
        />
      )}
      <TaxonomySheetDialog open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} />
    </>
  );

  return enabled
    ? { bulkActions, headerActions, dialogs, onFiltersChange: setFilters }
    : { bulkActions: undefined, headerActions: [], dialogs: null, onFiltersChange: undefined };
}
