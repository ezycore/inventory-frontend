"use client";
// coding-standard: maintained

import type { StorefrontHeroBanner } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

/**
 * Trim every field, mapping empties to undefined — the storefront falls back
 * to its built-in copy per-field, so "cleared" and "never set" behave the same.
 */
export function cleanHeroBanner(v: StorefrontHeroBanner): StorefrontHeroBanner {
  const t = (s?: string) => s?.trim() || undefined;
  return {
    badge: t(v.badge),
    title: t(v.title),
    subtitle: t(v.subtitle),
    primaryLabel: t(v.primaryLabel),
    primaryLink: t(v.primaryLink),
    secondaryLabel: t(v.secondaryLabel),
    secondaryLink: t(v.secondaryLink),
  };
}

function TextRow({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

/**
 * Customize → Theme: copy overrides for the static banner hero (the hero the
 * Classic / Hero Split home layouts show when the hero source is "banner" or
 * there are no slides). Placeholders show the standard English copy.
 */
export function BannerHeroCard({
  value,
  onChange,
}: {
  value: StorefrontHeroBanner;
  onChange: (v: StorefrontHeroBanner) => void;
}) {
  const set = (patch: Partial<StorefrontHeroBanner>) =>
    onChange({ ...value, ...patch });

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div>
        <h3 className="text-sm font-semibold">Banner hero text</h3>
        <p className="text-xs text-muted-foreground">
          Text on the static banner hero (Classic &amp; Hero Split home
          layouts). Leave a field empty to keep the standard bilingual copy —
          your own text shows as-is in both languages.
        </p>
      </div>
      <TextRow
        label="Badge"
        value={value.badge}
        onChange={(v) => set({ badge: v })}
        placeholder="Eid Sale · 10% off storewide"
        maxLength={60}
      />
      <TextRow
        label="Title"
        value={value.title}
        onChange={(v) => set({ title: v })}
        placeholder="Everyday essentials, delivered to your door"
        maxLength={90}
      />
      <TextRow
        label="Subtitle"
        value={value.subtitle}
        onChange={(v) => set({ subtitle: v })}
        placeholder="Groceries, electronics, tools and home needs — one cart, paid your way…"
        maxLength={160}
      />
      {(
        [
          {
            heading: "Primary button",
            label: value.primaryLabel,
            link: value.primaryLink,
            labelPlaceholder: "Shop now",
            patch: (label?: string, link?: string) =>
              set({
                ...(label !== undefined && { primaryLabel: label }),
                ...(link !== undefined && { primaryLink: link }),
              }),
          },
          {
            heading: "Secondary button",
            label: value.secondaryLabel,
            link: value.secondaryLink,
            labelPlaceholder: "Browse categories",
            patch: (label?: string, link?: string) =>
              set({
                ...(label !== undefined && { secondaryLabel: label }),
                ...(link !== undefined && { secondaryLink: link }),
              }),
          },
        ] as const
      ).map((btn) => (
        <div key={btn.heading} className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-medium">{btn.heading}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextRow
              label="Label"
              value={btn.label}
              onChange={(v) => btn.patch(v, undefined)}
              placeholder={btn.labelPlaceholder}
              maxLength={30}
            />
            <TextRow
              label="Link"
              value={btn.link}
              onChange={(v) => btn.patch(undefined, v)}
              placeholder="/products or https://…"
              maxLength={300}
            />
          </div>
        </div>
      ))}
    </Card>
  );
}
