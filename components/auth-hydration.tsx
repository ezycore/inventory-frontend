"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect } from "react";

/**
 * AuthHydration Component
 *
 * Ensures auth state is synced between cookies and Zustand store on client-side.
 * This prevents issues where middleware sees the cookie but client state isn't loaded yet.
 */
export function AuthHydration() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return null;
}
