"use client";
// coding-standard: maintained

import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { FooterLinksField } from "@/components/ecommerce/customize/footer-links-field";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { TrustBadgesField } from "@/components/ecommerce/customize/trust-badges-field";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Footer — the whole of it. This part is the reason the page was re-cut: the
 * layout used to live in Templates, the © line and trust badges in Theme, and
 * the link groups in Navigation, so "fix my footer" meant three tabs and three
 * save buttons.
 *
 * Every field here is optional and every blank falls back to the storefront's
 * own localized wording — so an untouched footer still reads correctly in both
 * languages, and clearing a field restores the default rather than leaving a
 * gap. The layout-specific blocks (trust badges, contact heading, sign-up copy)
 * only appear for the layout that renders them, with a hint pointing at the
 * layout otherwise: a field that edits something you cannot see is worse than
 * no field.
 */
export function FooterPart({
  draft,
  patch,
  patchTemplate,
  patchContentPages,
}: Pick<
  CustomizeDraftApi,
  "draft" | "patch" | "patchTemplate" | "patchContentPages"
>) {
  const layout = draft.templates.footer;
  const setBadge = (i: number, p: Partial<(typeof draft.badges)[number]>) =>
    patch({ badges: draft.badges.map((b, idx) => (idx === i ? { ...b, ...p } : b)) });
  const setNewsletter = (p: Partial<typeof draft.footerNewsletter>) =>
    patch({ footerNewsletter: { ...draft.footerNewsletter, ...p } });

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="footer"
          value={layout}
          onChange={(v) => patchTemplate("footer", v)}
        />
      </PartBlock>

      <FooterLinksField
        groups={draft.footerGroups}
        setGroups={(footerGroups) => patch({ footerGroups })}
        contentPages={draft.footerContentPages}
        setContentPages={patchContentPages}
      />

      <div className="space-y-1.5">
        <Label>About your shop</Label>
        <Input
          value={draft.footerText}
          onChange={(e) => patch({ footerText: e.target.value })}
          maxLength={280}
          placeholder="A line or two about what you sell and where you deliver."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Bottom line</Label>
        <Input
          value={draft.footerNote}
          onChange={(e) => patch({ footerNote: e.target.value })}
          maxLength={80}
          placeholder="Leave empty to show your currency"
        />
        <PartHint>
          Sits on the right of the copyright line — a trade licence number, a city,
          anything you need there.
        </PartHint>
      </div>

      {layout === "rich" ? (
        <PartBlock
          label="Trust badges"
          hint="Pick an icon and write your own promise, or leave the text empty to keep the default wording."
        >
          <TrustBadgesField badges={draft.badges} setBadge={setBadge} />
        </PartBlock>
      ) : null}

      {layout === "contact" ? (
        <PartBlock
          label="Contact block"
          hint="Your phone number comes from Settings → General, and the chat buttons from the WhatsApp button part. This footer shows them; it never stores a second copy."
        >
          <div className="space-y-1.5">
            <Label>Heading</Label>
            <Input
              value={draft.footerContactHeading}
              onChange={(e) => patch({ footerContactHeading: e.target.value })}
              maxLength={60}
              placeholder="Order by phone"
            />
          </div>
        </PartBlock>
      ) : null}

      {layout === "newsletter" ? (
        <PartBlock
          label="Sign-up block"
          hint="Addresses land under Online Store → Storefront Accounts → Subscribers. Leave a field empty to use the default wording."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Heading</Label>
              <Input
                value={draft.footerNewsletter.heading}
                onChange={(e) => setNewsletter({ heading: e.target.value })}
                maxLength={60}
                placeholder="Stay in touch"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={draft.footerNewsletter.blurb}
                onChange={(e) => setNewsletter({ blurb: e.target.value })}
                maxLength={200}
                placeholder="Get new arrivals and offers before anyone else."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Button</Label>
              <Input
                value={draft.footerNewsletter.buttonLabel}
                onChange={(e) => setNewsletter({ buttonLabel: e.target.value })}
                maxLength={30}
                placeholder="Subscribe"
              />
            </div>
          </div>
        </PartBlock>
      ) : null}

      {layout !== "rich" && layout !== "contact" && layout !== "newsletter" ? (
        <PartHint>
          Trust badges, a contact block and an email sign-up each belong to their
          own layout — switch to it above to edit them.
        </PartHint>
      ) : null}
    </>
  );
}
