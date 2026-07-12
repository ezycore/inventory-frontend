"use client";
// coding-standard: maintained

import type { StorefrontHeroSlide } from "@/types";
import { cn } from "@/ui/lib/utils";

/**
 * Tiny hero-slide thumbnail: the slide's image, or the brand-tinted panel
 * stand-in for imageless slides. Used by the slides panel rows and the Theme
 * section's summary card.
 */
export function SlideThumb({
  slide,
  className,
}: {
  slide: StorefrontHeroSlide;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block flex-none overflow-hidden rounded-md border bg-muted/40",
        className,
      )}
    >
      {slide.image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image.thumbnailUrl || slide.image.url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="block h-full w-full"
          style={{
            background:
              "linear-gradient(120deg, #171a2e 0%, #2c3567 100%)",
          }}
        />
      )}
    </span>
  );
}
