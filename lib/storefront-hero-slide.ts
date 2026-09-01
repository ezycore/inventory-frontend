// coding-standard: maintained

import type { StorefrontHeroSlide } from "@/types";

/** A slide may be artwork-only, text-only, or both; an entirely blank row is a draft. */
export const hasHeroSlideContent = (slide: StorefrontHeroSlide): boolean =>
  !!slide.image ||
  !!slide.mobileImage ||
  [slide.badge, slide.title, slide.subtitle, slide.buttonLabel].some(
    (text) => !!text?.trim(),
  );
