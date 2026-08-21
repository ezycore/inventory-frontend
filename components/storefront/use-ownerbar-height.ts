"use client";
// coding-standard: maintained

import { useEffect, type RefObject } from "react";

/** Publish the signed-in owner's overlay height for other bottom-pinned UI. */
export function useOwnerbarHeight(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (!root) return;
    const clear = () => root.style.removeProperty("--sf-ownerbar-h");
    if (!active) {
      clear();
      return clear;
    }
    const publish = () => {
      if (ref.current) {
        root.style.setProperty(
          "--sf-ownerbar-h",
          `${Math.round(ref.current.offsetHeight)}px`,
        );
      }
    };
    publish();
    const observer = new ResizeObserver(publish);
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [active, ref]);
}
