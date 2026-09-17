"use client";
// coding-standard: maintained

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/ui/components/card";
import { DateRangePicker } from "@/ui/components/date-range-picker";
import { formatInTimeZone } from "date-fns-tz";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { orgDateKey, pickedDayKey } from "@/lib/org-calendar";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Clock,
  Zap,
  X,
} from "lucide-react";
import type { StockMovementPeriod } from "@/services/api/modules/stock/api";

// ─── Date helpers (the org's calendar) ───────────────────────────────────────
/** `YYYY-MM-DD`, `n` days before today on the org's calendar. */
function daysAgo(n: number, tz: string): string {
  const [y, m, d] = orgDateKey(tz).split("-").map(Number);
  return formatInTimeZone(new Date(Date.UTC(y, m - 1, d - n)), "UTC", "yyyy-MM-dd");
}

function todayStr(tz: string): string {
  return orgDateKey(tz);
}

// ─── Preset types ────────────────────────────────────────────────────────────
export interface QuickPreset {
  id: string;
  /** inventory.movements.* message key for the chip label. */
  labelKey: string;
  icon: React.ReactNode;
  /**
   * Returns period-based filter params.
   * "today" maps directly to period="today".
   * All others use period="custom" with YYYY-MM-DD dates.
   * Timezone conversion is handled server-side.
   */
  getFilters: (tz: string) => { period: StockMovementPeriod; startDate?: string; endDate?: string };
  color: string;
}

const presets: QuickPreset[] = [
  {
    id: "today",
    labelKey: "movements.presetToday",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    getFilters: () => ({ period: "today" }),
    color:
      "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  },
  {
    id: "yesterday",
    labelKey: "movements.presetYesterday",
    icon: <Clock className="h-3.5 w-3.5" />,
    getFilters: (tz) => ({
      period: "custom",
      startDate: daysAgo(1, tz),
      endDate: daysAgo(1, tz),
    }),
    color:
      "bg-chart-4/10 text-chart-4 border-chart-4/30 hover:bg-chart-4/20 data-[active=true]:bg-chart-4 data-[active=true]:text-white",
  },
  {
    id: "last3",
    labelKey: "movements.presetLast3",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    getFilters: (tz) => ({
      period: "custom",
      startDate: daysAgo(3, tz),
      endDate: todayStr(tz),
    }),
    color:
      "bg-chart-1/10 text-chart-1 border-chart-1/30 hover:bg-chart-1/20 data-[active=true]:bg-chart-1 data-[active=true]:text-white",
  },
  {
    id: "last7",
    labelKey: "movements.presetLast7",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    getFilters: (tz) => ({
      period: "custom",
      startDate: daysAgo(7, tz),
      endDate: todayStr(tz),
    }),
    color:
      "bg-chart-5/10 text-chart-5 border-chart-5/30 hover:bg-chart-5/20 data-[active=true]:bg-chart-5 data-[active=true]:text-white",
  },
  {
    id: "last15",
    labelKey: "movements.presetLast15",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    getFilters: (tz) => ({
      period: "custom",
      startDate: daysAgo(15, tz),
      endDate: todayStr(tz),
    }),
    color:
      "bg-chart-2/10 text-chart-2 border-chart-2/30 hover:bg-chart-2/20 data-[active=true]:bg-chart-2 data-[active=true]:text-white",
  },
  {
    id: "last30",
    labelKey: "movements.presetLast30",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    getFilters: (tz) => ({
      period: "custom",
      startDate: daysAgo(30, tz),
      endDate: todayStr(tz),
    }),
    color:
      "bg-chart-3/10 text-chart-3 border-chart-3/30 hover:bg-chart-3/20 data-[active=true]:bg-chart-3 data-[active=true]:text-white",
  },
];

// ─── Direction presets ───────────────────────────────────────────────────────
const directionOptions = [
  { id: "all", labelKey: "movements.directionAll", icon: null },
  {
    id: "in",
    labelKey: "movements.statIn",
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
  },
  {
    id: "out",
    labelKey: "movements.statOut",
    icon: <ArrowUpFromLine className="h-3.5 w-3.5" />,
  },
];

// ─── QuickFilters component ─────────────────────────────────────────────────
export interface QuickFiltersResult {
  period?: StockMovementPeriod;
  startDate?: string;  // YYYY-MM-DD (only for period="custom")
  endDate?: string;    // YYYY-MM-DD (only for period="custom")
  movementType?: string;
}

interface QuickFiltersProps {
  onChange: (filters: QuickFiltersResult) => void;
}

export function QuickFilters({ onChange }: QuickFiltersProps) {
  const t = useTranslations("inventory");
  const { timezone } = useOrgCalendar();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [direction, setDirection] = useState<string>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  // Build filters from state and notify parent
  const emitFilters = useCallback(
    (
      presetId: string | null,
      dir: string,
      custom?: DateRange,
    ) => {
      const filters: QuickFiltersResult = {};

      // Date part — either preset or custom range
      // Send period + YYYY-MM-DD dates; backend handles timezone conversion
      if (custom?.from) {
        const startStr = pickedDayKey(custom.from);
        const endStr = custom.to ? pickedDayKey(custom.to) : startStr;
        filters.period = "custom";
        filters.startDate = startStr;
        filters.endDate = endStr;
      } else if (presetId) {
        const preset = presets.find((p) => p.id === presetId);
        if (preset) {
          const pf = preset.getFilters(timezone);
          filters.period = pf.period;
          if (pf.startDate) filters.startDate = pf.startDate;
          if (pf.endDate) filters.endDate = pf.endDate;
        }
      }

      // Direction part
      if (dir !== "all") {
        filters.movementType = dir;
      }

      onChange(filters);
    },
    [timezone, onChange],
  );

  const handlePresetClick = useCallback(
    (id: string) => {
      const next = activePreset === id ? null : id;
      setActivePreset(next);
      setCustomRange(undefined); // clear custom when preset selected
      emitFilters(next, direction, undefined);
    },
    [activePreset, direction, emitFilters],
  );

  const handleDirectionChange = useCallback(
    (dir: string) => {
      setDirection(dir);
      emitFilters(activePreset, dir, customRange);
    },
    [activePreset, customRange, emitFilters],
  );

  const handleCustomRange = useCallback(
    (range: DateRange | undefined) => {
      setCustomRange(range);
      if (range?.from) {
        setActivePreset(null); // clear preset when custom date selected
      }
      emitFilters(null, direction, range);
    },
    [direction, emitFilters],
  );

  const clearAll = useCallback(() => {
    setActivePreset(null);
    setDirection("all");
    setCustomRange(undefined);
    onChange({});
  }, [onChange]);

  const hasActiveFilter = activePreset || direction !== "all" || customRange?.from;

  // Active filter label for badge display
  const activeLabel = useMemo(() => {
    const parts: string[] = [];
    if (activePreset) {
      const preset = presets.find((p) => p.id === activePreset);
      if (preset) parts.push(t(preset.labelKey));
    } else if (customRange?.from) {
      const from = pickedDayKey(customRange.from);
      const to = customRange.to ? pickedDayKey(customRange.to) : from;
      parts.push(`${from} → ${to}`);
    }
    if (direction !== "all") {
      parts.push(direction === "in" ? t("movements.statIn") : t("movements.statOut"));
    }
    return parts.join(" · ");
  }, [activePreset, customRange, direction, t]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">{t("movements.quickFilters")}</CardTitle>
              <CardDescription className="text-xs">
                {t("movements.quickFiltersDesc")}
              </CardDescription>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-xs">
                {activeLabel}
              </Badge>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                <X className="h-3 w-3" />
                {t("movements.clear")}
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* ── Date presets ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              data-active={activePreset === preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${preset.color}`}
            >
              {preset.icon}
              {t(preset.labelKey)}
            </button>
          ))}

          {/* Custom date range picker */}
          <div className="ml-1">
            <DateRangePicker
              value={customRange}
              onChange={handleCustomRange}
              placeholder={t("movements.customRange")}
            />
          </div>
        </div>

        {/* ── Direction toggles ───────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {directionOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleDirectionChange(opt.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                direction === opt.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.icon}
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
