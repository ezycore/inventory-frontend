"use client";
// coding-standard: maintained
import { resolveSocialLook, type SocialLook } from "@/lib/storefront-social-proof";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * The sold chip + purchase toast look (Customize → Social proof), draft-first — same shape as
 * `useStoreCardBadges`. The Customize preview streams the whole set of keys as one draft, so a
 * drafted key replaces the saved one and an undrafted store reads exactly what it saved.
 */
export function useSocialLook(): SocialLook {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.socialLook);
  return resolveSocialLook(draft ?? store?.templates);
}
