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

      {draft.templates.footer === "rich" ? (
        <PartBlock
          label="Trust badges"
          hint="Pick an icon and write your own promise, or leave the text empty to keep the default wording."
        >
          <TrustBadgesField badges={draft.badges} setBadge={setBadge} />
        </PartBlock>
      ) : (
        <PartHint>
          Trust badges are part of the <span className="font-medium">Rich</span>{" "}
          footer — switch to it above to edit them.
        </PartHint>
      )}
    </>
  );
}
