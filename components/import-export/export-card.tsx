"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FilterBar } from "@ui/components/filters/filter-bar";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib/utils";
import type { ExportOption, FilterConfig } from "@/types/DataTable";

interface ExportCardProps {
  title: string;
  description: string;
  /** The list page's own filters, so an export here means what it meant there. */
  filterConfig: FilterConfig;
  /** What to export — a dataset or a column preset; the first is preselected. */
  choices: ExportOption[];
  note?: string;
  download: (params: Record<string, unknown>) => Promise<void>;
}

/**
 * One importable-back file in the Export tab. It replaces the Export button the
 * list pages had: that button exported whatever the list was filtered to, so
 * the card carries the same filters (`docs/plan/import-export-center.md`, trap 1).
 */
export function ExportCard({ title, description, filterConfig, choices, note, download }: ExportCardProps) {
  const t = useTranslations("importExport.export");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState(choices[0]?.key);
  const [busy, setBusy] = useState(false);

  const config = useMemo<FilterConfig>(
    () => ({ ...filterConfig, applyOnChange: true, onApply: setFilters }),
    [filterConfig],
  );

  const run = async () => {
    const choice = choices.find((c) => c.key === selected) ?? choices[0];
    setBusy(true);
    try {
      await download({ ...filters, ...(choice?.params ?? {}) });
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilterBar config={config} />
        <p className="text-xs text-muted-foreground">{t("matching")}</p>
        {choices.length > 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                aria-pressed={selected === choice.key}
                onClick={() => setSelected(choice.key)}
                className={cn(
                  "rounded-md border p-3 text-left text-sm transition",
                  selected === choice.key ? "border-primary ring-1 ring-primary" : "border-input hover:bg-accent",
                )}
              >
                <span className="font-medium">{choice.label}</span>
                {choice.description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{choice.description}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? t("preparing") : t("button")}
        </Button>
      </CardContent>
    </Card>
  );
}
