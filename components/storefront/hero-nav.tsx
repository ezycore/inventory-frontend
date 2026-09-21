"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * The rotating heroes' previous/next arrows — the merchant's alternative to the
 * dots, and their companion under "Both" (the hero's `nav` setting).
 *
 * Shared by `HeroSlidesView` and `HeroFullBleedView` so the two cannot disagree
 * about what an arrow looks like, the way their dots still do.
 *
 * ⚠ **Drawn on phones too**, unlike the category strip's arrows, which a
 * `(hover: hover)` query hides because a touch device scrolls that row by
 * swiping. A hero is different in the one way that matters: these are here
 * because the merchant asked for them, and a control that switches on for the
 * desktop and silently does nothing on the device most of their shoppers use is
 * the defect, not the saving. The hero still swipes; the arrows say so.
 *
 * Both buttons render whatever the current slide is: a rotation wraps, so
 * neither end is ever unreachable and a disabled arrow would be a lie.
 */
export function HeroNav({ onPrevious, onNext }: { onPrevious: () => void; onNext: () => void }) {
  const { t } = useStorefrontUI();
  return (
    <>
      <button
        type="button"
        className="sf-hero-arrow"
        data-edge="start"
        aria-label={t.previousSlide}
        onClick={onPrevious}
      >
        <Icon name="back" size={18} />
      </button>
      <button
        type="button"
        className="sf-hero-arrow"
        data-edge="end"
        aria-label={t.nextSlide}
        onClick={onNext}
      >
        <Icon name="chevR" size={18} />
      </button>
    </>
  );
}
