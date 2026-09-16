// coding-standard: maintained
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { AccountPageView } from "@/components/storefront/account/account-page";

/**
 * The account area — sign-in, the shopper's orders and their details — as the
 * core section of an account page on the builder. It takes no settings: what it
 * shows is the shopper's own data, and the one thing a merchant can decide about
 * it (whether the area exists at all) is a page control, not a section setting.
 */
export function AccountAreaSection(_props: SectionViewProps<Record<string, never>>) {
  return (
    <div className="sfb-core">
      <AccountPageView />
    </div>
  );
}
