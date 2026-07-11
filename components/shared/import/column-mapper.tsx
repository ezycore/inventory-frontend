"use client";
// coding-standard: maintained

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import type {
  ImportColumnMapping,
  ImportHeaderInfo,
} from "@/types/DataTable";

interface ColumnMapperProps {
  headerInfo: ImportHeaderInfo;
  /** Current explicit `expected header → CSV header` choices. */
  mapping: ImportColumnMapping;
  onChange: (mapping: ImportColumnMapping) => void;
}

/** Radix Select forbids empty item values — sentinel for "ignore this column". */
const IGNORE = "__ignore__";

/**
 * Inline column-mapping step for the import dialog. One row per CSV header the
 * auto-match didn't recognize (scales with the user's file, not the spec), each
 * with a select of the still-unmatched expected columns. Auto-matched pairs are
 * settled and not shown — mapping only resolves genuine mismatches.
 */
export function ColumnMapper({ headerInfo, mapping, onChange }: ColumnMapperProps) {
  // CSV headers claimed by the auto-match; the rest are the mappable rows.
  const autoMatched = new Set(
    headerInfo.columns
      .map((column) => column.matched)
      .filter((header): header is string => header !== null),
  );
  const rows = headerInfo.csvHeaders.filter((header) => !autoMatched.has(header));
  if (rows.length === 0) return null;

  // Reverse lookup: which expected column the user pointed at this CSV header.
  const chosenFor = (csvHeader: string): string | undefined =>
    Object.keys(mapping).find((expected) => mapping[expected] === csvHeader);

  const handleSelect = (csvHeader: string, value: string) => {
    const next = { ...mapping };
    const current = chosenFor(csvHeader);
    if (current) delete next[current];
    if (value !== IGNORE) next[value] = csvHeader;
    onChange(next);
  };

  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-sm font-medium">Match your file&apos;s columns</p>
      <p className="mb-3 text-xs text-muted-foreground">
        These columns in your file weren&apos;t recognized. Choose the field
        each one holds, or leave it ignored.
      </p>
      <div className="grid max-h-48 gap-2 overflow-y-auto">
        {rows.map((csvHeader) => {
          const chosen = chosenFor(csvHeader);
          // Offer expected columns not already matched or mapped elsewhere,
          // required first, plus this row's own current choice.
          const options = headerInfo.columns
            .filter(
              (column) =>
                column.header === chosen ||
                (column.matched === null && mapping[column.header] === undefined),
            )
            .sort((a, b) => Number(b.required ?? false) - Number(a.required ?? false));
          return (
            <div
              key={csvHeader}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm"
            >
              <span className="truncate" title={csvHeader}>
                {csvHeader}
              </span>
              <span className="text-muted-foreground">→</span>
              <Select
                value={chosen ?? IGNORE}
                onValueChange={(value) => handleSelect(csvHeader, value)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IGNORE}>
                    <span className="text-muted-foreground">Ignore</span>
                  </SelectItem>
                  {options.map((column) => (
                    <SelectItem key={column.header} value={column.header}>
                      {column.header}
                      {column.required ? " *" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
