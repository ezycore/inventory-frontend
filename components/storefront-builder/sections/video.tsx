// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { ASPECT_RATIOS } from "@/lib/storefront-builder/aspect-ratios";
import { parseVideoEmbed, videoPosterUrl } from "@/lib/storefront-builder/video-embed";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["video"]["settings"];

/**
 * A YouTube or Facebook video behind a click-to-load cover (plan §10): the page
 * carries a picture and a play button, and the provider's player — its script,
 * its cookies — loads only when the shopper presses play. Any other link draws
 * nothing (the registry skips it), because an embed is provider + id from an
 * allowlist, never a raw iframe (plan §11).
 *
 * The cover is the merchant's picture when set, else YouTube's own; a Facebook
 * video without one gets a plain dark cover.
 */
export function VideoSection({ settings }: SectionViewProps<Spec>) {
  const embed = parseVideoEmbed(settings.url);
  if (!embed) return null;
  // The desktop's shape decides the column: an upright video in an 880px box
  // would be a tower. A phone shape does not — the column is `100%` there.
  const ratio = settings.ratio?.base ?? "16:9";
  return (
    <div
      className="sfb-own-column"
      style={{ "--sfb-own-column": ratio === "9:16" ? "420px" : "880px" } as CSSProperties}
    >
      {settings.heading ? (
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          {settings.heading}
        </h2>
      ) : null}
      <Island
        name="video"
        props={{
          embed,
          label: settings.label,
          poster: settings.poster?.mediumUrl ?? settings.poster?.url ?? videoPosterUrl(embed),
          ratio: ASPECT_RATIOS[ratio],
          mobileRatio: settings.ratio?.mobile ? ASPECT_RATIOS[settings.ratio.mobile] : undefined,
        }}
      />
    </div>
  );
}
