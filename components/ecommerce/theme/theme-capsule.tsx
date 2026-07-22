"use client";
// coding-standard: maintained

/**
 * Live theme capsule pinned above the Theme groups: a mini storefront strip
 * (header bar + copy lines + CTA) painted with the CURRENT brand/accent draft,
 * plus the preset name and both hex values. Repaints as the draft changes —
 * the same signal the big preview gets, without looking away from the rail.
 */
export function ThemeCapsule({
  brandColor,
  accentColor,
  presetLabel,
}: {
  brandColor: string;
  accentColor: string;
  presetLabel: string;
}) {
  return (
    <div className="flex-none border-b px-3.5 pb-3 pt-3.5">
      <div className="overflow-hidden rounded-lg border">
        <div
          className="flex h-8 items-center gap-2 px-3"
          style={{ background: brandColor }}
        >
          <span className="h-3.5 w-3.5 rounded bg-white/90" />
          <span className="ml-auto flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1 w-5 rounded-full bg-white/45" />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2.5 bg-muted/50 px-3 py-2.5">
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="block h-1.5 w-3/4 rounded-full bg-border" />
            <span className="block h-1.5 w-1/2 rounded-full bg-border" />
          </span>
          <span
            className="h-3 w-6 rounded-full"
            style={{ background: accentColor }}
          />
          <span
            className="rounded-md px-2.5 py-1 text-[10px] font-semibold text-white"
            style={{ background: brandColor }}
          >
            Shop now
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-[11.5px] text-muted-foreground">
          Preset · <span className="font-semibold text-foreground">{presetLabel}</span>
        </span>
        <span className="flex flex-none gap-1.5">
          {[brandColor, accentColor].map((c, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 font-mono text-[10px] text-muted-foreground"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border"
                style={{ background: c }}
              />
              {c}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
