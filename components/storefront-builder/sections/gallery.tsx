// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { SfImage } from "@/components/storefront/sf-image";
import { SectionHeading } from "@/components/storefront-builder/section-heading";
import { SectionLink } from "@/components/storefront-builder/section-link";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["gallery"];
type Settings = SettingsOf<Spec["settings"]>;

const RATIOS: Record<NonNullable<Settings["frame"]>, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "3:4": "3 / 4",
  "4:3": "4 / 3",
  "16:9": "16 / 9",
};

const DESKTOP_COLUMNS = 3;
const PHONE_COLUMNS = 2;

/**
 * The grid's column counts as custom properties. A phone that was given no
 * value of its own takes two — or one, when the desktop shows one, so a phone
 * never shows more columns than a computer.
 */
export function galleryVars(settings: Pick<Settings, "columns" | "frame">): CSSProperties {
  const desktop = settings.columns?.base ?? DESKTOP_COLUMNS;
  const phone = settings.columns?.mobile ?? Math.min(desktop, PHONE_COLUMNS);
  return {
    "--sfb-gallery-cols": String(desktop),
    "--sfb-gallery-cols-m": String(phone),
    ...(settings.frame ? { "--sfb-gallery-frame": RATIOS[settings.frame] } : {}),
  } as CSSProperties;
}

/**
 * Pictures in a grid. Each tile is the picture, its caption under it, and — when
 * the merchant gave one — a link around both. Server markup only: no lightbox.
 */
export function GallerySection({
  settings,
  blocks,
  context,
}: SectionViewProps<Spec["settings"], Spec["blocks"]["settings"]>) {
  const desktop = settings.columns?.base ?? DESKTOP_COLUMNS;
  return (
    <div>
      <SectionHeading base={context.base} heading={settings.heading} />
      <ul className="sfb-gallery" data-frame={settings.frame ? "" : undefined} style={galleryVars(settings)}>
        {blocks.map(({ id, settings: tile }) => {
          const caption = tile.caption?.trim();
          const content = (
            <>
              <SfImage
                image={tile.image}
                alt={tile.alt?.trim() ?? ""}
                sizes={`(max-width: 679px) 50vw, ${Math.ceil(100 / desktop)}vw`}
                width={settings.frame ? undefined : tile.image.width}
                height={settings.frame ? undefined : tile.image.height}
                className="sfb-gallery-media"
              />
              {caption ? <span className="sfb-gallery-caption">{caption}</span> : null}
            </>
          );
          return (
            <li key={id}>
              {tile.link ? (
                <SectionLink base={context.base} href={tile.link} className="sfb-gallery-link">
                  {content}
                </SectionLink>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
