"use client";
// coding-standard: maintained

import { Smartphone } from "lucide-react";
import type { EditorDevice } from "./section-instances";

/**
 * The marker beside a control whose value can differ on phones: on the desktop
 * it says so, on a phone it says whether the phone has its own value. Shared by
 * section settings and the Style tab so both read the same.
 */
export function PhoneNote({ device, own }: { device: EditorDevice; own: boolean }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Smartphone className="h-3 w-3" aria-hidden />
      {device === "mobile" ? (own ? "Phone value" : "Same as desktop") : "Can differ on phones"}
    </span>
  );
}

/** Drops the phone's own value, back to the desktop's. Only drawn on a phone that has one. */
export function ResetToDesktop({ device, own, onReset }: { device: EditorDevice; own: boolean; onReset: () => void }) {
  if (device !== "mobile" || !own) return null;
  return (
    <button type="button" onClick={onReset} className="text-xs font-medium text-primary hover:underline">
      Reset to desktop
    </button>
  );
}
