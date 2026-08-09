"use client";
// coding-standard: maintained
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import {
  resolveLogoStyle,
  type ResolvedLogoStyle,
} from "@/lib/storefront-templates";

/**
 * The owner's logo chrome (Customize → Brand), draft-first.
 *
 * Read here rather than threaded down as a prop because `<Brand>` renders in six
 * places across the header variants and the footer — passing it through each
 * would be six chances to forget one, and a header whose logo styling depends on
 * which template the owner picked is exactly the bug this setting exists to fix.
 * `useStore` is the same cached query the header already runs, so this costs
 * nothing extra.
 */
export function useStoreLogoStyle(): ResolvedLogoStyle {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.logoStyle);
  return resolveLogoStyle(draft ?? store?.theme?.logo);
}
