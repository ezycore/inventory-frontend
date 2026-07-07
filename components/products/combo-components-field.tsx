"use client";
// coding-standard: maintained

import { useWatch } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@ui/components/button";
import { NumberField } from "@ui/components/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import { useSelectOptions } from "@/services/api";

interface ComboRow {
  componentProductId: string;
  // Phase 1: components are single products, so variant is always null.
  componentVariantId?: string | null;
  quantity: number;
}

interface ComboComponentsFieldProps {
  control: any;
  value?: ComboRow[];
  onChange?: (rows: ComboRow[]) => void;
}

/**
 * Combo composition editor, bound to the `comboComponents` field. Only rendered
 * for combo products. Components are picked from existing SINGLE products
 * (Phase 1 — variant components are supported by the backend but not offered
 * here yet). The picker prevents duplicates; the backend rejects them too.
 *
 * Used as a `customComponent` in DynamicForm.
 */
export default function ComboComponentsField({
  control,
  value = [],
  onChange,
}: ComboComponentsFieldProps) {
  const productType = useWatch({ control, name: "productType" });
  const selfId = useWatch({ control, name: "_id" });
  const { data: options = [] } = useSelectOptions(
    "/products?all=true&fields=_id,name,price,productType,variants",
  );

  // Fully controlled by the form field: `value` is the source of truth and every
  // edit flows through `onChange` (no local mirror — keeps React Compiler happy
  // and avoids drift with the form state on edit prefill).
  const rows = value;

  const rowKey = (r: { componentProductId: string; componentVariantId?: string | null }) =>
    `${r.componentProductId}|${r.componentVariantId ?? ""}`;

  // Flatten pickable units: a SINGLE product is one option; a VARIABLE product
  // expands into one option per variant (backend supports variant components).
  // Combos are excluded (no nesting), as is this product itself.
  const flatOptions: {
    key: string;
    componentProductId: string;
    componentVariantId: string | null;
    label: string;
  }[] = [];
  for (const o of options as any[]) {
    if (o.productType === "combo" || o.value === selfId) continue;
    if (o.productType === "variable" && Array.isArray(o.variants)) {
      for (const v of o.variants) {
        const attrs = Object.entries(v.attributes ?? {})
          .map(([k, val]) => `${k}: ${val}`)
          .join(", ");
        flatOptions.push({
          key: `${o.value}|${v._id}`,
          componentProductId: o.value,
          componentVariantId: v._id,
          label: attrs ? `${o.label} — ${attrs}` : o.label,
        });
      }
    } else if (o.productType === "single") {
      flatOptions.push({
        key: `${o.value}|`,
        componentProductId: o.value,
        componentVariantId: null,
        label: o.label,
      });
    }
  }

  if (productType !== "combo") return null;

  const update = (next: ComboRow[]) => onChange?.(next);

  const chosenKeys = new Set(rows.map(rowKey));
  const pickable = flatOptions.filter((o) => !chosenKeys.has(o.key));

  const labelOf = (r: ComboRow) =>
    flatOptions.find((o) => o.key === rowKey(r))?.label ?? r.componentProductId;

  const addComponent = (key: string) => {
    const opt = flatOptions.find((o) => o.key === key);
    if (!opt) return;
    update([
      ...rows,
      {
        componentProductId: opt.componentProductId,
        componentVariantId: opt.componentVariantId,
        quantity: 1,
      },
    ]);
  };

  const setQuantity = (key: string, qty: number | null) =>
    update(rows.map((r) => (rowKey(r) === key ? { ...r, quantity: qty ?? 1 } : r)));

  const removeComponent = (key: string) =>
    update(rows.filter((r) => rowKey(r) !== key));

  const columns: SimpleColumn<ComboRow>[] = [
    {
      key: "name",
      header: "Component",
      cellClassName: "font-medium text-sm py-1",
      cell: (row) => labelOf(row),
    },
    {
      key: "quantity",
      header: "Qty per combo",
      headClassName: "w-[160px]",
      cellClassName: "py-1",
      cell: (row) => (
        <NumberField
          precision={0}
          min={1}
          step={1}
          value={row.quantity}
          onChange={(v) => setQuantity(rowKey(row), v)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      headClassName: "w-[60px]",
      cellClassName: "py-1",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => removeComponent(rowKey(row))}
          title="Remove component"
        >
          <X className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <Select value="" onValueChange={addComponent}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add a product to this combo…" />
        </SelectTrigger>
        <SelectContent>
          {pickable.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No more products to add
            </div>
          ) : (
            pickable.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {rows.length > 0 ? (
        <div className="rounded-lg border">
          <SimpleTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => rowKey(row)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add at least one product. The combo sells as one unit at the price you set above.
        </p>
      )}
    </div>
  );
}
