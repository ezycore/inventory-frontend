"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogProduct } from "@/lib/storefront-client";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { partTargets } from "@/lib/storefront-builder/product-parts";
import { PART_NOTES, kindOf } from "./product-part-labels";
import { ProductTargetsField } from "./product-targets-field";
import type { EditorBlock, EditorDevice, EditorSection } from "./section-instances";
import { withPartTargets } from "./section-visibility";
import { SettingsFields } from "./settings-fields";

/**
 * The selected part's own settings, or what it is when it has none. A text or
 * collapsible part also says which products it shows on — a size chart for the
 * clothing, not the floor mats (`partTargets`).
 */
export function PartDetails({
  block,
  section,
  device,
  specs,
  previewProduct,
  onChange,
}: {
  block: EditorBlock;
  section: EditorSection;
  device: EditorDevice;
  specs: (typeof SECTION_SPECS)["product-main"]["blocks"]["settings"];
  /** The product the preview is drawn around, to say when this part is not on it. */
  previewProduct?: CatalogProduct | null;
  onChange: (settings: Record<string, unknown>) => void;
}) {
  const kind = kindOf(block);
  if (kind === "text" || kind === "collapsible") {
    const own = kind === "text" ? { text: specs.text } : { title: specs.title, text: specs.text, open: specs.open };
    const id = `${section.id}-${block.id}`;
    return (
      <>
        <SettingsFields
          idPrefix={id}
          sectionType="product-main"
          specs={own}
          settings={block.settings}
          device={device}
          sectionSettings={section.settings}
          onChange={onChange}
        />
        <ProductTargetsField
          id={id}
          targets={partTargets(block.settings)}
          previewProduct={previewProduct}
          onChange={(targets) => onChange(withPartTargets(block.settings, targets))}
        />
      </>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {PART_NOTES[kind]}
      {kind === "summary" && section.settings.hideDescription === true
        ? " “Hide the product's own words” is on below, so it shows nothing."
        : null}
      {kind === "promises" ? (
        <>
          {" "}
          <Link href="/ecommerce/customize?part=footer" className="font-medium text-primary hover:underline">
            Write them in Customize → Footer.
          </Link>
        </>
      ) : null}
    </p>
  );
}
