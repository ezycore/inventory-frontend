"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import type { FilterField } from "@/types/filter";
import {
  decoderForDefault,
  decoderForField,
  readListState,
  writeListState,
  type FilterDecoder,
  type ListFilters,
  type ListState,
  type ListUrlSpec,
  type SortOrder,
} from "@/lib/list-url-state";

export interface UseListUrlStateOptions<F extends ListFilters> {
  /** The first page, the page size and the filters an untouched list shows. */
  defaults: { page?: number; limit: number; sortBy?: string; sortOrder?: SortOrder; filters?: F };
  /** Filter-bar fields: each one's type decides how it reads back from the URL. */
  filterFields?: readonly FilterField[];
  /** Page sizes the list offers; a URL naming another falls back to the default. */
  limitOptions?: readonly number[];
  /** Prepended to every key, for a second list on the same screen. */
  prefix?: string;
  /**
   * Keep the state in the URL. Off for a list inside a sheet or dialog, whose
   * page is not the screen's and must not survive it being closed.
   */
  sync?: boolean;
}

export interface ListUrlState<F extends ListFilters> extends ListState<F> {
  setPage: (page: number) => void;
  /** A new page size starts again from page 1. */
  setLimit: (limit: number) => void;
  /** A new sort starts again from page 1. */
  setSort: (sortBy: string | undefined, sortOrder?: SortOrder) => void;
  /** Replace every filter; starts again from page 1. */
  setFilters: (filters: F) => void;
  /** Change some filters, keep the rest; starts again from page 1. */
  patchFilters: (patch: Partial<F>) => void;
  /** Back to the defaults. */
  reset: () => void;
  /**
   * Bumps each time the URL changes from outside. A filter bar seeds its inputs
   * once, so it is keyed on this to show what the URL now says.
   */
  revision: number;
}

/**
 * A filter's type, from its default: `false` is any boolean and `"all"` any
 * string, so a list can declare `{ featured: false }` and still set `true`.
 */
export type WidenFilters<F> = {
  [K in keyof F]: F[K] extends boolean
    ? boolean
    : F[K] extends string
      ? string
      : F[K] extends number
        ? number
        : F[K];
};

/** `useSearchParams` outside a Suspense boundary throws while prerendering; read nothing then. */
function useSafeSearchParams(): ReadonlyURLSearchParams | null {
  try {
    return useSearchParams();
  } catch {
    return null;
  }
}

/**
 * A paged list's page, page size, sort and filters, kept in the URL
 * (`lib/list-url-state.ts` has the rules). Back from a row lands on the same
 * page, a refresh keeps it, and the view can be shared as a link.
 *
 * Written with `history.replaceState`, which Next's router follows without a
 * server round-trip, and which adds no history entry — Back still leaves the
 * list rather than stepping through every filter the merchant tried.
 *
 * The URL wins when it changes from outside: following the sidebar link to the
 * same list, bare, resets it.
 */
export function useListUrlState<F extends ListFilters = ListFilters>(
  options: UseListUrlStateOptions<F>,
): ListUrlState<WidenFilters<F> & ListFilters> {
  const { filterFields, limitOptions, prefix, sync = true } = options;
  const searchParams = useSafeSearchParams();
  const pathname = usePathname();

  // Defaults arrive as a fresh object on every render; key the spec on content.
  const defaultsKey = JSON.stringify(options.defaults);
  const fieldsKey = filterFields?.map((field) => `${field.name}:${field.type}:${field.mode ?? ""}`).join("|");
  const spec = useMemo<ListUrlSpec<F>>(() => {
    const filters = (options.defaults.filters ?? {}) as F;
    const decoders: Record<string, FilterDecoder> = {};
    for (const [name, value] of Object.entries(filters)) decoders[name] = decoderForDefault(value);
    for (const field of filterFields ?? []) decoders[field.name] = decoderForField(field);
    return {
      prefix,
      limitOptions,
      decoders,
      defaults: {
        page: options.defaults.page ?? 1,
        limit: options.defaults.limit,
        sortBy: options.defaults.sortBy,
        sortOrder: options.defaults.sortOrder,
        filters,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on content, see above
  }, [defaultsKey, fieldsKey, prefix, limitOptions?.join(",")]);

  const readUrl = useCallback(
    () => readListState(new URLSearchParams(sync ? (searchParams?.toString() ?? "") : ""), spec),
    [searchParams, spec, sync],
  );

  const [state, setState] = useState<ListState<F>>(readUrl);
  const [revision, setRevision] = useState(0);

  // The query string this hook last wrote, so its own write is not mistaken for
  // an outside change and read back over newer local state.
  const query = searchParams?.toString() ?? "";
  const written = useRef<string | null>(query);
  useEffect(() => {
    if (!sync || query === written.current) return;
    written.current = query;
    setState(readUrl());
    setRevision((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the URL only
  }, [query, sync]);

  // Setters read the latest state through a ref, so they stay stable — and
  // `commit` moves it at once, so two setters in one event build on each other.
  const latest = useRef(state);
  latest.current = state;

  const commit = useCallback(
    (next: ListState<F>) => {
      latest.current = next;
      setState(next);
      if (!sync || typeof window === "undefined") return;
      const params = writeListState(new URLSearchParams(window.location.search), next, spec);
      const qs = params.toString();
      written.current = qs;
      window.history.replaceState(window.history.state, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, spec, sync],
  );

  const setPage = useCallback((page: number) => commit({ ...latest.current, page }), [commit]);
  const setLimit = useCallback(
    (limit: number) => commit({ ...latest.current, limit, page: 1 }),
    [commit],
  );
  const setSort = useCallback(
    (sortBy: string | undefined, sortOrder?: SortOrder) =>
      commit({ ...latest.current, sortBy, sortOrder, page: 1 }),
    [commit],
  );
  const setFilters = useCallback(
    (filters: F) => commit({ ...latest.current, filters, page: 1 }),
    [commit],
  );
  const patchFilters = useCallback(
    (patch: Partial<F>) =>
      commit({ ...latest.current, filters: { ...latest.current.filters, ...patch }, page: 1 }),
    [commit],
  );
  const reset = useCallback(() => commit(spec.defaults), [commit, spec]);

  return {
    ...state,
    setPage,
    setLimit,
    setSort,
    setFilters,
    patchFilters,
    reset,
    revision,
  } as unknown as ListUrlState<WidenFilters<F> & ListFilters>;
}
