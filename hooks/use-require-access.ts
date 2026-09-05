"use client";
// coding-standard: maintained
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/services/stores/use-auth-store";

export interface AccessRequirement {
  /** Whether this requirement is met. */
  allowed: boolean;
  /** Shown when it is not. First failing requirement wins. */
  message: string;
}

/**
 * Redirect off a screen the signed-in user may not use, and say why.
 *
 * Five settings pages had grown their own copy of this effect, each reading
 * `if (user && !canManage) { toast.error(...); router.push("/") }`. That guard
 * has one hole, and it is the one that bit: **`user` being truthy does not mean
 * the permission list has arrived.** Any moment where the store holds a session
 * whose `permissions` is still undefined — the protected layout's `/me` landing
 * mid-render, a persisted session rehydrating, a support session being adopted
 * — reads as "signed in, and allowed nothing", so the page accuses the merchant
 * of lacking a permission they hold and throws them to the dashboard (QA-R21).
 *
 * Two conditions have to hold before an accusation is safe to make:
 *
 * - **the session is staying** — during sign-out `isAuthenticated` drops first
 *   and the protected layout owns the redirect. A page shouting "no permission"
 *   on the way out is never right;
 * - **permissions are known** — an ARRAY, however empty. Absent is not empty:
 *   empty means the server said this user holds nothing, absent means nobody
 *   has said anything yet, and only the first is grounds to act.
 *
 * Requirements are checked in order and the first failure wins, so a page can
 * separate "you may not manage this" from "this feature is off" without racing
 * two toasts to the same screen.
 */
export function useRequireAccess(
  requirements: AccessRequirement[],
  redirectTo = "/",
) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const settled =
    isAuthenticated && !!user && Array.isArray(user.permissions);
  // Reduced to a string before it reaches the effect: `requirements` is a fresh
  // array literal on every render, so depending on it would re-run this (and
  // re-toast) on each keystroke anywhere on the page.
  const message = requirements.find((r) => !r.allowed)?.message;

  // Fire once per distinct refusal, not once per effect run.
  //
  // Reducing `requirements` to a string is not enough on its own: `router` is
  // in the dependency list and nothing promises its identity is stable, so a
  // re-render can re-run the effect with everything meaningful unchanged and
  // stack a second toast on a page that is already leaving. Keying on the
  // message rather than a plain `hasFired` boolean keeps the second, different
  // refusal reportable — the receipt page can go from "no permission" to
  // "not enabled" without the first one silencing the second.
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (!settled || !message) {
      // Re-arm: the requirement is met (or the answer went away again), so a
      // later refusal is news rather than a repeat.
      announced.current = null;
      return;
    }
    if (announced.current === message) return;
    announced.current = message;
    toast.error(message);
    router.push(redirectTo);
  }, [settled, message, router, redirectTo]);
}
