"use client";
// coding-standard: maintained

import type { ResolvedLanguageTheme } from "@/lib/storefront-language-theme";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartBlock,
  PartField,
  PartHint,
} from "@/components/ecommerce/customize/part-group";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Language & theme — which languages and colour schemes shoppers get.
 *
 * Before this part a shop always offered both languages and a dark switch,
 * and Customize could only MOVE the two switches between the header and the
 * info strip, never remove them — so an English-only catalogue still showed
 * "বাংলা", and a merchant whose brand only works on white could not keep
 * shoppers off dark mode. Where the switches sit is still Header's job; this
 * part decides whether there is anything to switch.
 *
 * Bangla translates the shop's own words, not the merchant's: the hint says so,
 * because "Bangla" on a catalogue of English product names is the question a
 * merchant asks next.
 */
export function LanguageThemePart({
  draft,
  patch,
}: Pick<CustomizeDraftApi, "draft" | "patch">) {
  const value = draft.languageTheme;
  const update = (next: Partial<ResolvedLanguageTheme>) =>
    patch({ languageTheme: { ...value, ...next } });

  return (
    <>
      <PartBlock
        label="Languages shoppers can use"
        hint="Bangla translates your shop's buttons and labels. Product names and descriptions show exactly as you wrote them."
      >
        <SegmentedField
          label="Languages shoppers can use"
          value={value.languages}
          onChange={(v) => update({ languages: v as ResolvedLanguageTheme["languages"] })}
          options={[
            { value: "both", label: "English + বাংলা", description: "Shoppers get a switch between the two" },
            { value: "en", label: "English", description: "English only — no language switch" },
            { value: "bn", label: "বাংলা", description: "Bangla only — no language switch" },
          ]}
        />
        {value.languages === "both" ? (
          <PartField label="Shop opens in">
            <SegmentedField
              label="Shop opens in"
              value={value.defaultLanguage}
              onChange={(v) => update({ defaultLanguage: v === "bn" ? "bn" : "en" })}
              options={[
                { value: "en", label: "English", description: "Until a shopper picks the other" },
                { value: "bn", label: "বাংলা", description: "Until a shopper picks the other" },
              ]}
            />
          </PartField>
        ) : null}
      </PartBlock>

      <PartBlock label="Dark mode">
        <SegmentedField
          label="Dark mode"
          value={value.darkMode}
          onChange={(v) => update({ darkMode: v === "light" ? "light" : "switch" })}
          options={[
            { value: "switch", label: "Shoppers can switch", description: "A light / dark switch in your header" },
            {
              value: "light",
              label: "Always light",
              description: "No switch. Shoppers who chose dark before see your shop light again",
            },
          ]}
        />
      </PartBlock>

      <PartHint>
        Where the switches sit is under Header: in the header or the info strip on a
        computer, and in the top bar or the menu on a phone.
      </PartHint>
    </>
  );
}
