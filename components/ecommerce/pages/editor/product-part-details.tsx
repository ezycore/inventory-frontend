"use client";
// coding-standard: maintained

import Link from "next/link";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { PART_NOTES, kindOf } from "./product-part-labels";
import type { EditorBlock, EditorDevice, EditorSection } from "./section-instances";
import { SettingsFields } from "./settings-fields";

/** The selected part's own settings, or what it is when it has none. */
export function PartDetails({
  block,
  section,
  device,
  specs,
  onChange,
}: {
  block: EditorBlock;
  section: EditorSection;
  device: EditorDevice;
  specs: (typeof SECTION_SPECS)["product-main"]["blocks"]["settings"];
  onChange: (settings: Record<string, unknown>) => void;
}) {
  const kind = kindOf(block);
  if (kind === "text" || kind === "collapsible") {
    const own = kind === "text" ? { text: specs.text } : { title: specs.title, text: specs.text, open: specs.open };
    return (
      <SettingsFields
        idPrefix={`${section.id}-${block.id}`}
        sectionType="product-main"
        specs={own}
        settings={block.settings}
        device={device}
        sectionSettings={section.settings}
        onChange={onChange}
      />
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
