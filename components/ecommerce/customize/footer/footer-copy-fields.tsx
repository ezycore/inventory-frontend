"use client";
// coding-standard: maintained

import { Input } from "@/ui/components/input";
import { PartField } from "@/components/ecommerce/customize/part-group";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

type CopyProps = Pick<CustomizeDraftApi, "draft" | "patch">;

/**
 * The sign-up block's wording. Addresses land in Storefront Accounts → Subscribers.
 *
 * Every field is optional and every blank falls back to the storefront's own
 * localized wording, so clearing a field restores the default rather than
 * leaving a gap. The footer's other words are edited where they show: the about
 * line in the brand block (`FooterBrandFields`), the right-side note in Bottom
 * line (`FooterBottomLineFields`).
 */
export function FooterNewsletterFields({ draft, patch }: CopyProps) {
  const setNewsletter = (p: Partial<typeof draft.footerNewsletter>) =>
    patch({ footerNewsletter: { ...draft.footerNewsletter, ...p } });
  return (
    <div className="space-y-3">
      <PartField label="Heading">
        <Input
          value={draft.footerNewsletter.heading}
          onChange={(e) => setNewsletter({ heading: e.target.value })}
          maxLength={60}
          placeholder="Stay in touch"
        />
      </PartField>
      <PartField label="Description">
        <Input
          value={draft.footerNewsletter.blurb}
          onChange={(e) => setNewsletter({ blurb: e.target.value })}
          maxLength={200}
          placeholder="Get new arrivals and offers before anyone else."
        />
      </PartField>
      <PartField
        label="Button"
        hint="Addresses land under Online Store → Storefront Accounts → Subscribers. Leave a field empty to use the default wording."
      >
        <Input
          value={draft.footerNewsletter.buttonLabel}
          onChange={(e) => setNewsletter({ buttonLabel: e.target.value })}
          maxLength={30}
          placeholder="Subscribe"
        />
      </PartField>
    </div>
  );
}
