// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { ASPECT_RATIOS } from "@/lib/storefront-builder/aspect-ratios";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { SfImage } from "@/components/storefront/sf-image";
import { SectionLink } from "@/components/storefront-builder/section-link";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["image-text"]["settings"];

/** A button draws only with both a label and a link — never as a dead button. */
const button = (label: string | undefined, href: string | undefined) =>
  label && href ? { label, href } : null;

/**
 * One photograph beside a heading, a paragraph and up to two buttons: the home
 * page's editorial split, with the merchant's own copy in place of its fixed
 * wording.
 *
 * Stacked on a phone; `imageSide` moves the photo only past the breakpoint and
 * `mobileFirst` decides which of the two leads the single column
 * (`.sfb-split` in `app/(storefront)/storefront-builder.css`).
 *
 * ⚠ `imageFit` is unset on every section saved before it existed, and unset
 * means `cover` — the crop this section has always drawn. A **fitted**
 * photograph needs the field written rather than left to the default.
 */
export function ImageTextSection({ settings, context }: SectionViewProps<Spec>) {
  const primary = button(settings.buttonLabel, settings.buttonHref);
  const secondary = button(settings.secondaryLabel, settings.secondaryHref);

  return (
    <div
      className="sfb-split"
      data-image-side={settings.imageSide ?? "left"}
      data-mobile-first={settings.mobileFirst ?? "picture"}
      data-image-fit={settings.imageFit ?? "crop"}
      style={
        {
          // The picture's share of the row past the breakpoint; the copy takes
          // what is left. One value, because the phone stacks into a single
          // column and has no row to divide.
          ...(settings.split !== undefined ? { "--sfb-split": `${settings.split}%` } : {}),
          ...responsiveVars("sfb-split-ratio", settings.imageRatio, (value) => ASPECT_RATIOS[value]),
        } as CSSProperties
      }
    >
      <SfImage
        image={settings.image}
        mobileImage={settings.mobileImage}
        alt={settings.image.alt ?? ""}
        sizes="(max-width: 679px) 100vw, 50vw"
        width={settings.image.width}
        height={settings.image.height}
        className="sfb-split-media"
      />
      <div>
        {settings.badge ? (
          <span style={{ fontSize: 11.5, color: "var(--sfb-muted, var(--muted))", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
            {settings.badge}
          </span>
        ) : null}
        <h2
          style={{
            fontSize: "var(--h1)",
            lineHeight: 1.08,
            fontWeight: 700,
            margin: settings.badge ? "14px 0 0" : 0,
            letterSpacing: "-0.03em",
            whiteSpace: "pre-line",
          }}
        >
          {settings.heading}
        </h2>
        {settings.text ? (
          <p style={{ fontSize: 15.5, color: "var(--sfb-muted, var(--muted))", lineHeight: 1.65, margin: "16px 0 0", maxWidth: 460, whiteSpace: "pre-line" }}>
            {settings.text}
          </p>
        ) : null}
        {primary || secondary ? (
          <div className="sfb-actions">
            {primary ? (
              <SectionLink base={context.base} href={primary.href} className="sfb-button">
                {primary.label}
              </SectionLink>
            ) : null}
            {secondary ? (
              <SectionLink base={context.base} href={secondary.href} className="sfb-button sfb-button--ghost">
                {secondary.label}
              </SectionLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
