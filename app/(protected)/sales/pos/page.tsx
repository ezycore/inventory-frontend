"use client";
// coding-standard: maintained
import { Suspense } from "react";
import { PosScreen } from "@/components/sales/pos/pos-screen";

/**
 * The full-screen POS counter. `ProtectedShell` renders this route without the
 * sidebar; the `/sales` layout's `RouteAccessGuard` still gates it.
 * Suspense because `useSellPage` reads `?draftId=`.
 */
export default function PosPage() {
  return (
    <Suspense>
      <PosScreen />
    </Suspense>
  );
}
