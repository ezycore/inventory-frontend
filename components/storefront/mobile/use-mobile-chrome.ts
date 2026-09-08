"use client";
// coding-standard: maintained

import { useMemo } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import { logoImageUrl } from "@/lib/storefront-image";
import {
  resolveMobileChrome,
  type MobileChrome,
} from "@/lib/storefront-mobile";
import { useSfPreview, useSfPreviewImage } from "@/services/stores/use-sf-preview-store";

/**
 * The phone chrome this render should draw — the saved store, with the Customize
 * editor's unsaved draft winning.
 *
 * **Every surface that draws mobile chrome must come through here**, the same
 * rule `useStoreTemplate` states for the page layouts: reading
 * `resolveMobileChrome(store.templates, store.theme?.mobile)` directly pins the
 * bar to the SAVED value, so the merchant would move the cart icon in Customize
 * and watch the preview beside them ignore it until Save.
 *
 * Two draft keys, not one, because they are edited by different controls and
 * either can be drafted without the other: the picker writes `templates.mobile`,
 * the slot editor writes `theme.mobile`.
 */
export function useMobileChrome(store?: StorefrontStore): MobileChrome & { template: string } {
  const draftTemplate = useSfPreview((s) => s.mobile);
  const draftChrome = useSfPreview((s) => s.mobileChrome);
  const savedTemplate = store?.templates?.mobile;
  const savedChrome = store?.theme?.mobile;

  return useMemo(
    () =>
      resolveMobileChrome(
        { mobile: draftTemplate ?? savedTemplate },
        draftChrome ?? savedChrome,
      ),
    [draftTemplate, savedTemplate, draftChrome, savedChrome],
  );
}

/**
 * The mark the phone bar shows: the merchant's phone artwork, else whatever the
 * desktop header uses.
 *
 * Both halves are preview-aware and the fallback is why this is a hook rather
 * than an expression at the call site — `useSfPreviewImage` distinguishes "the
 * editor removed it" (`null`) from "the editor has not sent one" (`undefined`),
 * and collapsing that with `??` would make removing the mobile logo look broken:
 * the saved file would come straight back.
 */
export function useMobileBrandLogo(store?: StorefrontStore): string | undefined {
  const mobile = useSfPreviewImage("mobileLogo", store?.mobileLogo);
  const desktop = useSfPreviewImage("logo", store?.logo);
  const pick = mobile ?? desktop;
  // Through the shared helper rather than an ordering spelled out here. This
  // one happened to be right — `url` first — but it is the same question the
  // header, the footer and every admin preview of a mark answer, and a second
  // hand-written ordering is how a call site drifts onto the square crop.
  return logoImageUrl(pick);
}
