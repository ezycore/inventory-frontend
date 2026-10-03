"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

function useSafeSearchParams(): ReadonlyURLSearchParams | null {
  try {
    return useSearchParams();
  } catch {
    return null;
  }
}

/**
 * One choice kept in the URL — a page's tab, typically — so Back from a row
 * opened on the second tab returns to that tab rather than the first.
 *
 * Only `allowed` values are read; anything else is the default. The default is
 * never written, and every other param is kept. Written with
 * `history.replaceState`, like `useListUrlState`, so it costs no server
 * round-trip and adds no history entry.
 */
export function useUrlParam<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const searchParams = useSafeSearchParams();
  const pathname = usePathname();
  const raw = searchParams?.get(name) ?? null;
  const parse = (value: string | null): T =>
    value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

  const [value, setValue] = useState<T>(() => parse(raw));

  // Follow the URL when it changes from outside (a link to `?tab=…`).
  const written = useRef(raw);
  useEffect(() => {
    if (raw === written.current) return;
    written.current = raw;
    setValue(parse(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the URL only
  }, [raw]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (next === fallback) params.delete(name);
      else params.set(name, next);
      written.current = next === fallback ? null : next;
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [fallback, name, pathname],
  );

  return [value, set];
}
