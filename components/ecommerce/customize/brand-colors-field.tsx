"use client";
// coding-standard: maintained

import { ColorField } from "@/ui/components/color-field";

/**
 * Brand + accent pickers with a live contrast check: the CTA button and accent
 * link rendered on the shop's light AND dark grounds — a near-black brand can
 * sink on dark cards (see the storefront skill), and this surfaces it while the
 * colour is being chosen rather than after it ships.
 */
export function BrandColorsField({
  brandColor,
  accentColor,
  setBrandColor,
  setAccentColor,
}: {
  brandColor: string;
  accentColor: string;
  setBrandColor: (v: string) => void;
  setAccentColor: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <ColorField
        label="Brand"
        layout="inline"
        value={brandColor}
        onChange={setBrandColor}
      />
      <ColorField
        label="Accent"
        layout="inline"
        value={accentColor}
        onChange={setAccentColor}
      />
      <div className="overflow-hidden rounded-lg border bg-background">
        <p className="px-2.5 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Contrast check
        </p>
        <div className="mt-1.5 grid grid-cols-2">
          {(["light", "dark"] as const).map((ground) => (
            <div
              key={ground}
              className="flex items-center gap-2 p-2.5"
              style={{ background: ground === "light" ? "#ffffff" : "#17171b" }}
            >
              <span
                className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                style={{
                  background: brandColor,
                  border:
                    ground === "dark" ? "1px solid rgba(255,255,255,0.3)" : undefined,
                }}
              >
                Shop now
              </span>
              <span className="text-xs font-semibold" style={{ color: accentColor }}>
                View all →
              </span>
            </div>
          ))}
        </div>
        <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
          How your buttons &amp; links read on the shop&apos;s light and dark themes.
        </p>
      </div>
    </div>
  );
}
