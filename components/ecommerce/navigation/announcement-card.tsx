"use client";
// coding-standard: maintained

import type { Image } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import { AnnouncementBgField } from "@/components/ecommerce/navigation/announcement-bg-field";

export interface AnnouncementDraft {
  enabled: boolean;
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
  icon: string;
  ctaLabel: string;
  dismissible: boolean;
  size: "sm" | "md" | "lg";
  bgImage: Image | null;
  overlay: string;
  overlayOpacity: number;
  bgFit: "cover" | "tile";
}

const SIZES: { value: AnnouncementDraft["size"]; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const FITS: { value: AnnouncementDraft["bgFit"]; label: string; hint: string }[] =
  [
    { value: "cover", label: "Cover", hint: "Fills the bar (a photo backdrop)" },
    { value: "tile", label: "Tile", hint: "Repeats a small pattern" },
  ];

/** Customize → Navigation → the single-line bar above the storefront header. */
export function AnnouncementCard({
  value,
  onChange,
}: {
  value: AnnouncementDraft;
  onChange: (patch: Partial<AnnouncementDraft>) => void;
}) {
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Announcement bar</h3>
          <p className="text-xs text-muted-foreground">
            A single line shown at the top of every storefront page.
          </p>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          aria-label="Enable announcement bar"
        />
      </div>
      {value.enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Text</Label>
            <Input
              value={value.text}
              onChange={(e) => onChange({ text: e.target.value })}
              maxLength={200}
              placeholder="Free delivery on orders over ৳2000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Icon (emoji)</Label>
            <Input
              value={value.icon}
              onChange={(e) => onChange({ icon: e.target.value })}
              maxLength={8}
              placeholder="🚚"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link (optional)</Label>
            <Input
              value={value.link}
              onChange={(e) => onChange({ link: e.target.value })}
              placeholder="/products"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Button label (optional)</Label>
            <Input
              value={value.ctaLabel}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
              maxLength={40}
              placeholder="Shop now"
            />
            <p className="text-[11px] text-muted-foreground">
              Shows a button (uses the link above). Leave blank to make the whole
              bar the link.
            </p>
          </div>

          <ColorField
            label="Background color"
            value={value.bgColor}
            onChange={(bgColor) => onChange({ bgColor })}
          />
          <ColorField
            label="Text color (optional)"
            value={value.textColor}
            onChange={(textColor) => onChange({ textColor })}
            hint="Blank = auto-matched for contrast"
          />

          <div className="space-y-3 sm:col-span-2">
            <AnnouncementBgField
              image={value.bgImage}
              onChange={(bgImage) => onChange({ bgImage })}
            />
            {value.bgImage && (
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Image fit</Label>
                  <div className="flex flex-wrap gap-2">
                    {FITS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => onChange({ bgFit: f.value })}
                        title={f.hint}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          value.bgFit === f.value
                            ? "border-primary ring-2 ring-primary/30"
                            : "hover:bg-muted/50",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ColorField
                  label="Overlay color"
                  value={value.overlay}
                  onChange={(overlay) => onChange({ overlay })}
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Overlay strength — {value.overlayOpacity}%</Label>
                  {/* Native range: no shared Slider primitive; sibling of the
                      native color picker in ColorField. */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value.overlayOpacity}
                    onChange={(e) =>
                      onChange({ overlayOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-primary"
                    aria-label="Overlay strength"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Darkens the image so the text stays readable.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Size</Label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onChange({ size: s.value })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    value.size === s.value
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:bg-muted/50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:col-span-2">
            <div>
              <Label className="cursor-default">Dismissible</Label>
              <p className="text-[11px] text-muted-foreground">
                Let shoppers close the bar (reappears when the message changes).
              </p>
            </div>
            <Switch
              checked={value.dismissible}
              onCheckedChange={(dismissible) => onChange({ dismissible })}
              aria-label="Allow shoppers to dismiss the announcement bar"
            />
          </div>
        </div>
      )}
    </Card>
  );
}

/** Colour swatch + hex input pair — reused for background and text colour. */
function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 flex-none rounded border"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
