"use client";
// coding-standard: maintained

import { ColorField } from "@/ui/components/color-field";
import { NumberField } from "@/ui/components/number-field";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { resolveLogoStyle } from "@/lib/storefront-templates";
import type { StorefrontLogoStyle } from "@/types";
import { useId } from "react";

/** Bounds mirror the backend validator; the shop clamps to these too. */
const LIMITS = {
  height: { min: 20, max: 80 },
  padding: { min: 0, max: 24 },
  radius: { min: 0, max: 40 },
} as const;

/** The header's height when the owner has set none — keep in step with `Brand`. */
const DEFAULT_HEIGHT = 42;

/**
 * Backdrop / height / padding / radius for the uploaded logo, with a preview on
 * both shop themes.
 *
 * The two-ground preview is the point of the control, not decoration. The whole
 * problem it solves is a mark that is legible on one theme and invisible on the
 * other, so showing one ground would let an owner "fix" the dark theme and ship
 * a logo that has vanished on the light one. The grounds are the storefront's
 * real `--page` values, hardcoded here because this is admin chrome rendering a
 * storefront swatch — it has no access to those CSS vars.
 */
export function LogoStyleField({
  value,
  onChange,
  logoUrl,
}: {
  value: StorefrontLogoStyle;
  onChange: (next: StorefrontLogoStyle) => void;
  logoUrl: string;
}) {
  // Resolved the same way the shop resolves it, so the preview cannot claim a
  // rendering the storefront would not produce.
  const resolved = resolveLogoStyle(value);
  const patch = (p: Partial<StorefrontLogoStyle>) => onChange({ ...value, ...p });
  const boxHeight = resolved.height ?? DEFAULT_HEIGHT;

  return (
    <div className="space-y-2.5">
      <ColorField
        label="Backdrop"
        layout="inline"
        value={value.background ?? ""}
        fallback="#ffffff"
        onChange={(background) => patch({ background })}
        hint="Leave empty for no backdrop (transparent)."
      />

      <div className="grid grid-cols-3 gap-2">
        <SizeInput
          label="Height"
          value={value.height}
          placeholder={DEFAULT_HEIGHT}
          limits={LIMITS.height}
          onChange={(height) => patch({ height })}
        />
        <SizeInput
          label="Padding"
          value={value.padding}
          placeholder={0}
          limits={LIMITS.padding}
          onChange={(padding) => patch({ padding })}
        />
        <SizeInput
          label="Radius"
          value={value.radius}
          placeholder={0}
          limits={LIMITS.radius}
          onChange={(radius) => patch({ radius })}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <p className="px-2.5 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          On both shop themes
        </p>
        <div className="mt-1.5 grid grid-cols-2">
          {(["light", "dark"] as const).map((ground) => (
            <div
              key={ground}
              className="flex items-center justify-center p-3"
              style={{ background: ground === "light" ? "#f8fafc" : "#09090b" }}
            >
              <span
                className="inline-flex"
                style={{
                  background: resolved.background,
                  padding: resolved.padding,
                  borderRadius: resolved.radius,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`Logo on the ${ground} theme`}
                  style={{
                    // Mirrors `Brand`: padding is taken out of the box height
                    // rather than added to it.
                    height: Math.max(boxHeight - resolved.padding * 2, 1),
                    width: "auto",
                    maxWidth: 150,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onChange({})}
      >
        Reset to default
      </Button>
    </div>
  );
}

/** One px field. Empty is a real value — it means "use the default". */
function SizeInput({
  label,
  value,
  placeholder,
  limits,
  onChange,
}: {
  label: string;
  value: number | undefined;
  placeholder: number;
  limits: { min: number; max: number };
  onChange: (value: number | undefined) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="cursor-default text-xs text-muted-foreground">
        {label}
      </Label>
      <NumberField
        id={id}
        value={value ?? null}
        // `null` back to `undefined`: the payload must OMIT a cleared field, not
        // send an explicit null, or the backend stores one and the resolver's
        // "absent ⇒ default" branch never runs again.
        onChange={(n) => onChange(n ?? undefined)}
        min={limits.min}
        max={limits.max}
        precision={0}
        size="sm"
        placeholder={String(placeholder)}
      />
    </div>
  );
}
