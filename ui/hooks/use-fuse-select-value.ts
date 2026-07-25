// coding-standard: maintained

import type { SelectOption } from "@/ui/components/form/type";
import type {
  FuseSelectMode,
  FuseSelectValue,
  LabelValueOption,
} from "@ui/components/fuse-select-types";
import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Value plumbing for `FuseAdvancedSelect`: normalises the incoming value (which
 * may be a string, an array, or `{label,value}` object(s)), re-shapes what goes
 * back out when `labelInValue` is set, and owns the two value-driven side
 * effects — the `onMount` enrichment callback and the one-shot `defaultFlag`
 * pre-fill. Markup and focus behaviour live in the component.
 */

interface UseFuseSelectValueParams {
  value?: FuseSelectValue;
  onValueChange?: (value: FuseSelectValue) => void;
  mode: FuseSelectMode;
  /** Resolved option list — static `options` or the fetched `optionsApi` page. */
  finalOptions: SelectOption[];
  /** Set when options come from the API, so effects can wait for the first page. */
  optionsApi?: string;
  labelInValue: boolean;
  onMount?: (value: FuseSelectValue | undefined) => void;
  defaultFlag?: string;
}

interface UseFuseSelectValueResult {
  /** Commit a raw value (string or string[]); `labelInValue` is applied here. */
  handleValueChange: (raw: string | string[]) => void;
  /** Single mode: the committed option value, or "". */
  singleValue: string;
  /** Single mode: label for `singleValue`, falling back to the raw value. */
  selectedLabel: string;
  /** Multi mode: committed option values. */
  multiValues: string[];
  /** Label for an arbitrary option value, falling back to the value itself. */
  labelOf: (optionValue: string) => string;
}

export function useFuseSelectValue({
  value,
  onValueChange,
  mode,
  finalOptions,
  optionsApi,
  labelInValue,
  onMount,
  defaultFlag,
}: UseFuseSelectValueParams): UseFuseSelectValueResult {
  // Guards the one-time default auto-select so we never override the user.
  const defaultAppliedRef = useRef(false);

  const extractRaw = useCallback(
    (val: FuseSelectValue | undefined): string | string[] => {
      if (!val) return mode === "multiple" ? [] : "";
      if (Array.isArray(val))
        return val.map((v) => (typeof v === "object" ? v.value : v));
      return typeof val === "object" ? val.value : val;
    },
    [mode]
  );

  const findOption = useCallback(
    (valueStr: string): SelectOption | LabelValueOption =>
      finalOptions.find((o) => o.value === valueStr) ?? {
        label: valueStr,
        value: valueStr,
      },
    [finalOptions]
  );

  const labelOf = useCallback(
    (optionValue: string) => findOption(optionValue).label,
    [findOption]
  );

  const formatValue = useCallback(
    (raw: string | string[]): FuseSelectValue => {
      if (!labelInValue) return raw;
      if (Array.isArray(raw)) return raw.map((v) => findOption(v));
      return findOption(raw);
    },
    [labelInValue, findOption]
  );

  const handleValueChange = useCallback(
    (raw: string | string[]) => {
      onValueChange?.(formatValue(raw));
    },
    [formatValue, onValueChange]
  );

  // onMount enrichment
  useEffect(() => {
    if (!onMount) return;
    if (optionsApi && finalOptions.length === 0) return;
    const rawVal = extractRaw(value);
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) return;
    onMount(labelInValue ? formatValue(rawVal) : value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value]);

  // Auto-select the default option once for empty single-selects. Editing an
  // existing record keeps its value (we only fill when nothing is set).
  useEffect(() => {
    if (!defaultFlag || mode === "multiple" || defaultAppliedRef.current) return;
    if (optionsApi && finalOptions.length === 0) return;

    const rawVal = extractRaw(value);
    const hasValue = Array.isArray(rawVal) ? rawVal.length > 0 : !!rawVal;
    if (hasValue) {
      defaultAppliedRef.current = true;
      return;
    }

    const defaultOption = finalOptions.find(
      (opt) => (opt as unknown as Record<string, unknown>)[defaultFlag] === true
    );
    if (defaultOption) {
      defaultAppliedRef.current = true;
      handleValueChange(defaultOption.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value, defaultFlag]);

  const actualValue = extractRaw(value);

  const singleValue = Array.isArray(actualValue)
    ? actualValue[0] || ""
    : actualValue || "";

  const selectedLabel =
    finalOptions.find((o) => o.value === singleValue)?.label ?? singleValue;

  const multiValues = useMemo<string[]>(
    () =>
      Array.isArray(actualValue) ? actualValue : actualValue ? [actualValue] : [],
    [actualValue]
  );

  return { handleValueChange, singleValue, selectedLabel, multiValues, labelOf };
}
