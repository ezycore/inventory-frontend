"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { NavLinkType, StorefrontMenuItem } from "@/types";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";

export type NavOption = { label: string; value: string };

export type ChildrenMode = NonNullable<StorefrontMenuItem["childrenMode"]>;

export const newMenuItem = (): StorefrontMenuItem => ({
  label: "New link",
  type: "url",
  value: "",
});

const TYPE_OPTIONS: NavOption[] = [
  { label: "Category", value: "category" },
  { label: "Page", value: "page" },
  { label: "URL", value: "url" },
];
const COLLECTIONS_OPTION: NavOption = {
  label: "All collections",
  value: "collections",
};

const CHILDREN_MODES: { label: string; value: ChildrenMode; description: string }[] = [
  { label: "Its sub-categories", value: "auto", description: "Always the category's own sub-categories, kept up to date" },
  { label: "Links I pick", value: "custom", description: "Exactly the links you add below" },
  { label: "No dropdown", value: "none", description: "Just the link" },
];

/**
 * Which dropdown a category item has, with the pre-2026-09-24 rule applied to
 * an item saved before `childrenMode` existed: authored children mean the
 * merchant picked them, none means the category's own sub-categories.
 */
export const effectiveChildrenMode = (item: StorefrontMenuItem): ChildrenMode =>
  item.childrenMode ?? (item.children?.length ? "custom" : "auto");

/** Up/down arrows for one row in an ordered list. */
function MoveButtons({
  index,
  count,
  onMove,
  size = "h-4 w-4",
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  size?: string;
}) {
  return (
    <div className="flex flex-none flex-col pt-1.5">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className="text-muted-foreground disabled:opacity-30"
        aria-label="Move up"
      >
        <ArrowUp className={size} />
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        className="text-muted-foreground disabled:opacity-30"
        aria-label="Move down"
      >
        <ArrowDown className={size} />
      </button>
    </div>
  );
}

export function LinkFields({
  item,
  categoryOptions,
  pageOptions,
  allowCollections,
  resolveCategory,
  onChange,
}: {
  item: StorefrontMenuItem;
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  allowCollections?: boolean;
  /**
   * Maps a stored category value to its option. Items saved before 2026-09-24
   * hold a bare LEAF slug; the picker now stores the full path, which is the
   * only unique name for a sub-category ("Accessories" under two parents).
   */
  resolveCategory: (value: string) => string;
  onChange: (patch: Partial<StorefrontMenuItem>) => void;
}) {
  const isCollections = item.type === "collections";
  const setType = (v: string) =>
    onChange({
      type: v as NavLinkType,
      value: "",
      ...(v === "collections"
        ? { label: "All collections" }
        : isCollections
          ? { label: "" }
          : {}),
    });

  return (
    <div className="grid flex-1 grid-cols-[110px_minmax(0,1fr)] gap-2">
      {!isCollections && (
        <Input
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          className="col-span-2 h-8"
          aria-label="Link label"
        />
      )}
      <SimpleSelect
        value={item.type}
        onValueChange={setType}
        options={
          allowCollections ? [...TYPE_OPTIONS, COLLECTIONS_OPTION] : TYPE_OPTIONS
        }
        className={isCollections ? "col-span-2 h-8" : "h-8"}
      />
      {isCollections ? null : item.type === "url" ? (
        <Input
          value={item.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="/path or https://…"
          className="h-8"
          aria-label="Link URL"
        />
      ) : (
        <SimpleSelect
          value={item.type === "category" ? resolveCategory(item.value) : item.value}
          onValueChange={(v) => onChange({ value: v })}
          options={item.type === "category" ? categoryOptions : pageOptions}
          placeholder={`Select ${item.type}`}
          className="h-8"
        />
      )}
    </div>
  );
}

export function MenuItemRow({
  item,
  index,
  count,
  categoryOptions,
  pageOptions,
  allowCollections,
  resolveCategory,
  subcategoryCount,
  onPatch,
  onRemove,
  onMove,
  onAddChild,
  onPatchChild,
  onRemoveChild,
  onMoveChild,
}: {
  item: StorefrontMenuItem;
  index: number;
  count: number;
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  allowCollections?: boolean;
  resolveCategory: (value: string) => string;
  /** How many sub-categories the chosen category has — for the `auto` note. */
  subcategoryCount: number;
  onPatch: (patch: Partial<StorefrontMenuItem>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddChild: () => void;
  onPatchChild: (ci: number, patch: Partial<StorefrontMenuItem>) => void;
  onRemoveChild: (ci: number) => void;
  onMoveChild: (ci: number, dir: -1 | 1) => void;
}) {
  const children = item.children ?? [];
  const isCategory = item.type === "category";
  const mode = isCategory ? effectiveChildrenMode(item) : "custom";
  // A collections block expands inline — dropdown children don't apply.
  const editsChildren = item.type !== "collections" && mode === "custom";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <MoveButtons index={index} count={count} onMove={onMove} />
        <LinkFields
          item={item}
          categoryOptions={categoryOptions}
          pageOptions={pageOptions}
          allowCollections={allowCollections}
          resolveCategory={resolveCategory}
          onChange={onPatch}
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isCategory ? (
        <div className="mt-2 grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 pl-6">
          <span className="text-xs text-muted-foreground">Dropdown</span>
          <SimpleSelect
            value={mode}
            onValueChange={(v) => onPatch({ childrenMode: v as ChildrenMode })}
            options={CHILDREN_MODES}
            className="h-8"
          />
          {mode === "auto" ? (
            <p className="col-span-2 text-xs text-muted-foreground">
              {subcategoryCount
                ? `Shows its ${subcategoryCount} sub-categor${subcategoryCount === 1 ? "y" : "ies"} — new ones appear on their own.`
                : "This category has no sub-categories yet, so there is no dropdown."}
            </p>
          ) : null}
        </div>
      ) : null}

      {editsChildren && children.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 pl-4">
          {children.map((child, ci) => (
            <div key={ci} className="flex items-start gap-2">
              <MoveButtons
                index={ci}
                count={children.length}
                onMove={(dir) => onMoveChild(ci, dir)}
                size="h-3.5 w-3.5"
              />
              <LinkFields
                item={child}
                categoryOptions={categoryOptions}
                pageOptions={pageOptions}
                resolveCategory={resolveCategory}
                onChange={(patch) => onPatchChild(ci, patch)}
              />
              <button
                type="button"
                onClick={() => onRemoveChild(ci)}
                className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
                aria-label="Remove sub-item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {editsChildren && (
        <button
          type="button"
          onClick={onAddChild}
          className="mt-2 text-xs font-semibold text-primary"
        >
          + Add sub-item
        </button>
      )}
    </div>
  );
}
