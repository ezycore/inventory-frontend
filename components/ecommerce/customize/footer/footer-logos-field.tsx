"use client";
// coding-standard: maintained

import { useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useUploadStorefrontImage } from "@/services/api";
import { FOOTER_LOGOS_MAX, type FooterLogo } from "@/lib/storefront-footer/types";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { MoveButtons } from "@/components/ecommerce/customize/menu-item-fields";
import { moveItem } from "@/components/ecommerce/customize/use-nav-link-options";

/**
 * A strip of small logos — payment methods, couriers, partners — each the
 * merchant's own upload. The platform ships no logo set of its own: which marks
 * a shop shows is between the shop and those companies.
 *
 * A logo uploads the moment it is picked (the preview needs its URL), through
 * the storefront image upload, and is saved with the footer. Its description is
 * required: it is the only thing a screen reader can say about it.
 */
export function FooterLogosField({
  logos,
  onChange,
}: {
  logos: FooterLogo[];
  onChange: (logos: FooterLogo[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadStorefrontImage();
  const busy = upload.isPending;

  const pick = (file: File) =>
    upload.mutate(file, {
      onSuccess: (res) => {
        if (!res.data) return;
        // The file name is a better first guess at "what it shows" than nothing.
        const name = file.name.replace(/\.[^.]+$/, "").slice(0, 80);
        onChange([...logos, { image: res.data, alt: name }]);
      },
    });

  const patch = (i: number, next: Partial<FooterLogo>) =>
    onChange(logos.map((logo, idx) => (idx === i ? { ...logo, ...next } : logo)));

  return (
    <div className="space-y-2">
      {logos.length === 0 ? <PartHint>No logos yet.</PartHint> : null}
      {logos.map((logo, i) => (
        <div key={`${logo.image.url}:${i}`} className="flex items-start gap-2">
          <MoveButtons
            index={i}
            count={logos.length}
            onMove={(dir) => onChange(moveItem(logos, i, dir))}
            size="h-3.5 w-3.5"
          />
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-md border bg-muted/30 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- merchant upload preview */}
            <img
              src={logo.image.thumbnailUrl || logo.image.url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </span>
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Input
              value={logo.alt}
              onChange={(e) => patch(i, { alt: e.target.value })}
              maxLength={80}
              placeholder="What it shows, e.g. bKash"
              className="h-8"
              aria-label="Logo description"
            />
            <Input
              value={logo.url ?? ""}
              onChange={(e) => patch(i, { url: e.target.value })}
              maxLength={300}
              placeholder="Link (optional)"
              className="h-8"
              aria-label="Logo link"
            />
            {!logo.alt.trim() ? (
              <PartHint tone="warn">Describe this logo — shoppers using a screen reader hear only this.</PartHint>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onChange(logos.filter((_, idx) => idx !== i))}
            className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
            aria-label="Remove logo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) pick(file);
        }}
      />
      {logos.length < FOOTER_LOGOS_MAX ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1.5 h-4 w-4" />}
          Add logo
        </Button>
      ) : (
        <PartHint>That is the most a strip holds ({FOOTER_LOGOS_MAX}).</PartHint>
      )}
    </div>
  );
}
