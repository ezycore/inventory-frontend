"use client";
// coding-standard: maintained

import { Input } from "@/ui/components/input";

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 flex-none text-xs text-muted-foreground">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color swatch`}
        className="h-8 w-8 flex-none cursor-pointer rounded-lg border"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color hex`}
        className="h-8 font-mono text-xs"
      />
    </div>
  );
}

/**
 * Brand + accent pickers with a live contrast check: the CTA button and accent
 * link rendered on the shop's light AND dark grounds — a near-black brand can
 * sink on dark cards (see storefront skill), and this surfaces it immediately.
 */
export function ColorsBody({
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
      <ColorRow label="Brand" value={brandColor} onChange={setBrandColor} />
      <ColorRow label="Accent" value={accentColor} onChange={setAccentColor} />
      <div className="overflow-hidden rounded-lg border">
        <p className="px-2.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
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
                className="rounded-md px-2 py-1 text-[10.5px] font-semibold text-white"
                style={{
                  background: brandColor,
                  border:
                    ground === "dark"
                      ? "1px solid rgba(255,255,255,0.3)"
                      : undefined,
                }}
              >
                Shop now
              </span>
              <span
                className="text-[10.5px] font-semibold"
                style={{ color: accentColor }}
              >
                View all →
              </span>
            </div>
          ))}
        </div>
        <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">
          How your buttons &amp; links read on the shop&apos;s light and dark
          themes.
        </p>
      </div>
    </div>
  );
}
