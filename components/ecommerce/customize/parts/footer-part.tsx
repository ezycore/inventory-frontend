"use client";
// coding-standard: maintained

import {
  asHomeVariant,
  resolveHomeSections,
} from "@/lib/storefront-home-sections";
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
  const setBadge = (i: number, p: Partial<(typeof draft.badges)[number]>) =>
    patch({ badges: draft.badges.map((b, idx) => (idx === i ? { ...b, ...p } : b)) });

  const richFooter = draft.templates.footer === "rich";
  const homeTrustRow = resolveHomeSections(
    draft.homepageSections,
    asHomeVariant(draft.templates.home),
  ).includes("trust");

  return (
    <>
      <PartBlock label="Layout">
        <TemplatePicker
          templateKey="footer"
          value={draft.templates.footer}
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
        <Label>Copyright line</Label>
        <Input
          value={draft.footerText}
          onChange={(e) => patch({ footerText: e.target.value })}
          maxLength={280}
          placeholder="© Your store. All rights reserved."
        />
      </div>

      {/*
        Editable whenever they are visible ANYWHERE — the Rich footer or the
        home "Delivery & returns" row. Gating on the Rich footer alone (as this
        did until the home row started using them) strands a merchant who put
        the row on their home page but kept a Columns footer: their promises
        would render with no way to write them.
      */}
      {richFooter || homeTrustRow ? (
        <PartBlock
          label="Trust badges"
          hint={
            richFooter && homeTrustRow
              ? "Shown in the footer and in the home Delivery & returns row. Leave a line empty to keep the default wording."
              : richFooter
                ? "Shown above your footer links. Leave the text empty to keep the default wording."
                : "Shown in the home Delivery & returns row. Leave a line empty to keep the default wording."
          }
        >
          <TrustBadgesField
            badges={draft.badges}
            setBadge={setBadge}
            showSubtitle={homeTrustRow}
          />
        </PartBlock>
      ) : (
        <PartHint>
          Trust badges appear in the <span className="font-medium">Rich</span>{" "}
          footer, or in the home page&apos;s{" "}
          <span className="font-medium">Delivery &amp; returns</span> row — turn
          on either to edit them.
        </PartHint>
      )}
    </>
  );
}
