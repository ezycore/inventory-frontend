// coding-standard: maintained
import type { SegmentedOption } from "@/ui/components/segmented-field";
import type { SocialLookKey } from "@/lib/storefront-social-proof";

/**
 * The choices in Customize → Social proof (docs/plan/social-proof.md §6).
 *
 * Kept OUT of `TEMPLATE_OPTIONS` on purpose: those are layout ids, each drawn as a wireframe
 * tile and seeded into every draft. These are short text ramps on a `SegmentedField`, and an
 * unset key must stay unset so the look keeps following the theme. The first option of each is
 * what `resolveSocialLook` falls back to. The two custom colours are free hex values, not options.
 */
export const SOCIAL_LOOK_OPTIONS: Partial<Record<SocialLookKey, SegmentedOption[]>> = {
  soldChipStyle: [
    { value: "soft", label: "Soft", description: "A light tint of the colour" },
    { value: "solid", label: "Solid", description: "Filled, with readable text picked for you" },
    { value: "outline", label: "Outline", description: "A thin border in the colour" },
    { value: "text", label: "Text", description: "Coloured words, no badge" },
  ],
  soldChipSize: [
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
  ],
  soldChipIcon: [
    { value: "none", label: "None" },
    { value: "fire", label: "Flame" },
    { value: "bag", label: "Bag" },
  ],
  stockChipIcon: [
    { value: "clock", label: "Clock" },
    { value: "fire", label: "Flame" },
    { value: "none", label: "None" },
  ],
  toastStyle: [
    { value: "light", label: "Light", description: "Your card colour, with a border" },
    { value: "dark", label: "Dark", description: "Near-black with light text" },
    { value: "brand", label: "Brand", description: "Your theme colour, with readable text" },
    { value: "custom", label: "Custom", description: "Your own background and text colour" },
  ],
  toastSize: [
    { value: "normal", label: "Normal" },
    { value: "compact", label: "Compact", description: "Smaller text and photo" },
  ],
  toastRadius: [
    { value: "theme", label: "Theme", description: "Follows your theme's corners" },
    { value: "square", label: "Square" },
    { value: "rounded", label: "Rounded" },
    { value: "pill", label: "Pill" },
  ],
  toastImage: [
    { value: "square", label: "Square photo" },
    { value: "round", label: "Round photo" },
  ],
};

/** An option's label, for the rail's one-line summary. */
export const socialLookLabel = (key: SocialLookKey, value: string) =>
  SOCIAL_LOOK_OPTIONS[key]?.find((o) => o.value === value)?.label ?? value;
