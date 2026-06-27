"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import type { StorefrontSettings } from "@/types";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";

export default function ThemePage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preset, brand colors, logo &amp; banner, and homepage layout — with a
          live preview.
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
  const rest = HOMEPAGE_SECTIONS.filter((s) => !order.includes(s.id)).map(
    (s) => ({ id: s.id, enabled: false }),
  );
  return [...enabled, ...rest];
}

function ThemeForm({ settings }: { settings: StorefrontSettings }) {
  const save = useUpdateStorefrontSettings();
  const media = useUpdateStorefrontMedia();
  const slug = useAuthStore((s) => s.user?.organization?.slug);
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

  const enabledSectionIds = sections.filter((s) => s.enabled).map((s) => s.id);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
      {/* LEFT — controls */}
      <div className="space-y-5">
        {/* Preset */}
        <Card className="p-5 shadow-none">
          <h3 className="mb-1 text-sm font-semibold">Preset</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            A one-click baseline. You can still fine-tune colors below.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => pickPreset(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  preset === p.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="flex">
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: p.brandColor }}
                  />
                  <span
                    className="-ml-1.5 h-5 w-5 rounded-full border"
                    style={{ backgroundColor: p.accentColor }}
                  />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Branding */}
        <Card className="space-y-4 p-5 shadow-none">
          <h3 className="text-sm font-semibold">Branding</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ColorField label="Brand color" value={brandColor} onChange={setBrandColor} />
            <ColorField
              label="Accent color"
              value={accentColor}
              onChange={setAccentColor}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Footer text</Label>
            <Input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              maxLength={280}
              placeholder="© Your store. All rights reserved."
            />
          </div>
        </Card>

        {/* Logo + banner */}
        <Card className="space-y-4 p-5 shadow-none">
          <h3 className="text-sm font-semibold">Logo &amp; banner</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        </Card>

        {/* Homepage sections */}
        <Card className="p-5 shadow-none">
          <h3 className="mb-1 text-sm font-semibold">Homepage layout</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Toggle sections on/off and drag them into order. The preview updates
            live.
          </p>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <label className="flex items-center gap-2.5">
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={() => toggleSection(s.id)}
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
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save theme"}
          </Button>
        </div>
      </div>

      {/* RIGHT — live preview (the REAL storefront in preview mode) */}
      <div className="lg:sticky lg:top-6">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Live preview
        </div>
        <StorePreviewFrame
          slug={slug}
          brandColor={brandColor}
          accentColor={accentColor}
          sectionIds={enabledSectionIds}
        />
      </div>
    </div>
  );
}

/* ------------------------------- live preview ------------------------------ */

/**
 * Renders the REAL storefront home in an iframe (`?preview=1`) and streams the
 * unsaved draft (brand/accent + enabled section order) into it via postMessage —
 * a WordPress-customizer-style preview against the actual site. Same-origin, so
 * postMessage is direct and styles are isolated inside the iframe document.
 */
function StorePreviewFrame({
  slug,
  brandColor,
  accentColor,
  sectionIds,
}: {
  slug?: string;
  brandColor: string;
  accentColor: string;
  sectionIds: string[];
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const sectionsKey = sectionIds.join(",");

  const post = useCallback(() => {
    ref.current?.contentWindow?.postMessage(
      {
        type: "ezycore-preview",
        payload: {
          theme: { brandColor, accentColor },
          sections: sectionsKey ? sectionsKey.split(",") : [],
        },
      },
      "*",
    );
  }, [brandColor, accentColor, sectionsKey]);

  // Push the draft whenever it changes…
  useEffect(() => {
    post();
  }, [post]);

  // …and whenever the storefront (re)loads and announces it's ready.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "ezycore-preview-ready") post();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  if (!slug) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
        Store URL unavailable.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <iframe
        ref={ref}
        src={`${storefrontUrl(slug)}?preview=1`}
        title="Storefront preview"
        onLoad={post}
        className="h-[640px] w-full border-0"
      />
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 flex-none rounded border"
          aria-label={`${label} swatch`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
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
      <Label>{label}</Label>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">
            No {label.toLowerCase()}
          </span>
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
