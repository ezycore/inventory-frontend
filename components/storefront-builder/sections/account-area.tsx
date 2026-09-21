// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { AccountPageView } from "@/components/storefront/account/account-page";

type Spec = (typeof SECTION_SPECS)["account-area"]["settings"];

/**
 * The account area — sign-in, the shopper's orders and their details — as the
 * core section of an account page on the builder.
 *
 * What it SHOWS is the shopper's own data, and whether the area exists at all
 * is a page control — so `layout` is the only setting: today's
 * `templates.accountLayout` become a section setting, unset on every page the
 * migration builds.
 */
export function AccountAreaSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <AccountPageView layout={settings.layout} />
    </div>
  );
}
