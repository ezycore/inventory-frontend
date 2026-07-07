"use client";

import { useFilters } from "@/hooks/use-filters";
import { FilterConfig } from "@/types/DataTable";
import React from "react";
import { FilterPanel } from "./filter-panel";

interface GlobalFilterProps {
  config: FilterConfig;
  trigger?: React.ReactNode;
}

/**
 * Self-contained Advanced-filter button + panel. Owns its own filter state and
 * calls `config.onApply` / `config.onReset`. Use when the panel is the sole
 * filter surface (e.g. DataCard). For inline controls + overflow, use `FilterBar`.
 */
export function GlobalFilter({ config, trigger }: GlobalFilterProps) {
  const state = useFilters(
    config.fields ?? [],
    config.onApply,
    config.applyOnChange,
    config.initialValues,
  );

  return <FilterPanel config={config} state={state} trigger={trigger} />;
}
