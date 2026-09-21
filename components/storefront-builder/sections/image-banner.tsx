// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { ASPECT_RATIOS } from "@/lib/storefront-builder/aspect-ratios";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { focalPosition } from "@/lib/storefront-focal";
import { SfImage } from "@/components/storefront/sf-image";
import { SectionLink } from "@/components/storefront-builder/section-link";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["image-banner"]["settings"];
type Settings = SettingsOf<Spec>;

/** The shape and focus point as custom properties — the phone's own, when set, as `-m`. */
function bannerVars(settings: Settings): CSSProperties {
  const focal = settings.focal;
  return {
    ...responsiveVars("sfb-banner-frame", settings.frame, (ratio) => ASPECT_RATIOS[ratio]),
    ...(focal?.base ? { "--sfb-banner-focal": focalPosition(focal.base) } : {}),
    ...(focal?.mobile ? { "--sfb-banner-focal-m": focalPosition(focal.mobile) } : {}),
    // Unset keeps each alignment's OWN shade, which the stylesheet draws: a
    // gradient under bottom-anchored words, a flat wash under centred ones.
    ...(settings.scrim !== undefined ? { "--sfb-banner-scrim": `${settings.scrim}%` } : {}),
  } as CSSProperties;
}

/**
 * One picture across the page. The words sit over it on a shade that keeps them
 * readable; a button needs both a label and a link. With a link and no button
 * label, the whole banner is the link — never both, since a link inside a link
 * is invalid markup.
 *
 * Server markup only. Shape and focus point are CSS variables (`.sfb-banner`),
 * so the phone's shape paints in the first byte.
 */
export function ImageBannerSection({ settings, context }: SectionViewProps<Spec>) {
  const heading = settings.heading?.trim();
  const text = settings.text?.trim();
  const buttonLabel = settings.buttonLabel?.trim();
  const button = buttonLabel && settings.link ? { label: buttonLabel, href: settings.link } : undefined;
  const hasCopy = !!(heading || text || button);

  const body: ReactNode = (
    <>
      <SfImage
        image={settings.image}
        mobileImage={settings.mobileImage}
        alt={settings.alt?.trim() ?? ""}
        sizes="100vw"
        width={settings.frame?.base ? undefined : settings.image.width}
        height={settings.frame?.base ? undefined : settings.image.height}
        className="sfb-banner-media"
      />
      {/* ⚠ THREE attributes where there was one. `align` used to decide the side,
          the height and the shade together, so a merchant could not ask for left
          copy in the middle of the picture and could not touch the shade at all.
          Unset on all three reproduces the old pair exactly — left means bottom
          under a gradient, centre means middle under a flat wash — which the
          stylesheet's own two blocks still draw. */}
      {hasCopy ? (
        <div
          className="sfb-banner-copy"
          data-align={settings.align?.base ?? "left"}
          data-align-m={settings.align?.mobile}
          data-valign={settings.verticalAlign?.base}
          data-valign-m={settings.verticalAlign?.mobile}
          data-scrim={settings.scrim !== undefined ? "" : undefined}
        >
          {heading ? <h2 className="sfb-banner-heading">{heading}</h2> : null}
          {text ? <p className="sfb-banner-text">{text}</p> : null}
          {button ? (
            <SectionLink base={context.base} href={button.href} className="sfb-button">
              {button.label}
            </SectionLink>
          ) : null}
        </div>
      ) : null}
    </>
  );

  // Two attributes, not one: a shape chosen on the phone alone must not crop the
  // desktop, which keeps drawing the picture whole (`sfb-banner-box[data-frame]`
  // and its `-m` twin in the builder stylesheet).
  const frameAttr = settings.frame?.base ? "" : undefined;
  const mobileFrameAttr = settings.frame?.mobile ? "" : undefined;
  const box = (
    <div data-frame={frameAttr} data-frame-m={mobileFrameAttr} className="sfb-banner-box">
      {body}
    </div>
  );
  if (settings.link && !button) {
    return (
      <SectionLink base={context.base} href={settings.link} className="sfb-banner" style={bannerVars(settings)}>
        {box}
      </SectionLink>
    );
  }
  return (
    <div className="sfb-banner" style={bannerVars(settings)}>
      {box}
    </div>
  );
}
