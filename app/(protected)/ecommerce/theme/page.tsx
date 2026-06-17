"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  useGetStorefrontSettings,
  useUpdateStorefrontMedia,
  useUpdateStorefrontSettings,
} from "@/services/api";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTIONS,
  THEME_PRESETS,
  getPreset,
} from "@/lib/storefront-theme";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

export default function ThemePage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Theme</h1>
        <p className="text-sm text-muted-foreground">
          Preset, brand colors, logo/banner, and homepage layout.
        </p>
      </div>
      {isLoading || !settings ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ThemeForm settings={settings} />
      )}
    </div>
  );
}

const labelOf = (id: string) =>
  HOMEPAGE_SECTIONS.find((s) => s.id === id)?.label ?? id;

/** Merge saved (enabled, ordered) sections with the full catalog (disabled tail). */
function initSections(saved?: string[]): { id: string; enabled: boolean }[] {
  const order = saved ?? DEFAULT_HOMEPAGE_SECTIONS;
  const enabled = order
    .filter((id) => HOMEPAGE_SECTIONS.some((s) => s.id === id))
    .map((id) => ({ id, enabled: true }));
  const rest = HOMEPAGE_SECTIONS.filter(
    (s) => !order.includes(s.id),
  ).map((s) => ({ id: s.id, enabled: false }));
  return [...enabled, ...rest];
}

function ThemeForm({ settings }: { settings: StorefrontSettings }) {
  const save = useUpdateStorefrontSettings();
  const media = useUpdateStorefrontMedia();
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const t = settings.theme ?? {};
  const presetDefaults = getPreset(t.preset);
  const [preset, setPreset] = useState(t.preset ?? "default");
  const [brandColor, setBrandColor] = useState(
    t.brandColor ?? presetDefaults.brandColor,
  );
  const [accentColor, setAccentColor] = useState(
    t.accentColor ?? presetDefaults.accentColor,
  );
  const [footerText, setFooterText] = useState(t.footerText ?? "");
  const [sections, setSections] = useState(() =>
    initSections(t.homepageSections),
  );

  const pickPreset = (id: string) => {
    setPreset(id);
    const def = getPreset(id);
    setBrandColor(def.brandColor);
    setAccentColor(def.accentColor);
  };

  const toggleSection = (id: string) =>
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );

  const move = (index: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = () => {
    save.mutate({
      theme: {
        preset,
        brandColor,
        accentColor,
        footerText: footerText.trim() || undefined,
        homepageSections: sections.filter((s) => s.enabled).map((s) => s.id),
      },
    });
  };

  const uploadMedia = (field: "logo" | "banner", file: File) => {
    const fd = new FormData();
    fd.append(field, file);
    media.mutate(fd);
  };

  const removeMedia = (field: "logo" | "banner") => {
    const fd = new FormData();
    fd.append(field === "logo" ? "removeLogo" : "removeBanner", "true");
    media.mutate(fd);
  };

  return (
    <div className="space-y-4">
      {/* Preset */}
      <Card>
        <CardHeader>
          <CardTitle>Preset</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => pickPreset(p.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                preset === p.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "hover:bg-muted/50"
              }`}
            >
              <span
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: p.brandColor }}
              />
              <span
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: p.accentColor }}
              />
              {p.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Colors + footer */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField label="Brand color" value={brandColor} onChange={setBrandColor} />
          <ColorField label="Accent color" value={accentColor} onChange={setAccentColor} />
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-muted-foreground">Footer text</label>
            <input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              maxLength={280}
              placeholder="© Your store. All rights reserved."
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo + banner */}
      <Card>
        <CardHeader>
          <CardTitle>Logo &amp; banner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MediaField
            label="Logo"
            url={settings.logo?.thumbnailUrl || settings.logo?.url}
            inputRef={logoInput}
            disabled={media.isPending}
            onPick={(file) => uploadMedia("logo", file)}
            onRemove={settings.logo ? () => removeMedia("logo") : undefined}
          />
          <MediaField
            label="Banner"
            url={settings.banner?.mediumUrl || settings.banner?.url}
            inputRef={bannerInput}
            disabled={media.isPending}
            onPick={(file) => uploadMedia("banner", file)}
            onRemove={settings.banner ? () => removeMedia("banner") : undefined}
          />
        </CardContent>
      </Card>

      {/* Homepage sections */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggleSection(s.id)}
                />
                {labelOf(s.id)}
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save theme"}
        </Button>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}

function MediaField({
  label,
  url,
  inputRef,
  disabled,
  onPick,
  onRemove,
}: {
  label: string;
  url?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onPick: (file: File) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">No {label.toLowerCase()}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </Button>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onRemove}
            className="text-red-600"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
