"use client";
// coding-standard: maintained

import { useState } from "react";
import { Check } from "lucide-react";
import {
  STORE_THEMES,
  getStoreTheme,
  themeDrift,
  type ThemeApplyScope,
} from "@/lib/storefront-themes";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Ready-made whole-store themes — the "I have no taste, just make it look
 * good" control, and the shortcut past ten individual pickers.
 *
 * Picking one applies straight into the draft, like every other control in the
 * rail: the preview repaints, every part it touched goes dirty so the merchant
 * can see the blast radius before committing, and Discard is the undo. There is
 * deliberately no confirm dialog — the draft already is the safety net.
 *
 * What it will never do is touch content. Hero slides, trust-badge copy, footer
 * links, menu items and announcement text are the merchant's work and survive
 * every theme change; a theme that overwrote them would be data loss wearing a
 * styling feature's clothes.
 */
export function ThemePart({
  draft,
  applyTheme,
}: {
  draft: CustomizeDraft;
  applyTheme: (id: string, scope: ThemeApplyScope) => void;
}) {
  // Transient UI preference, not draft data — resetting to "both" when the part
  // is reopened is fine, and keeps it out of the dirty comparison.
  const [scope, setScope] = useState<ThemeApplyScope>({
    layout: true,
    colors: true,
  });
  const applied = getStoreTheme(draft.appliedThemeId);
  const drift = applied ? themeDrift(applied, draft) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {STORE_THEMES.map((t) => {
          const active = draft.appliedThemeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(t.id, scope)}
              disabled={!scope.layout && !scope.colors}
              className={cn(
                "rounded-lg border p-1 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "hover:border-border hover:bg-muted/40",
              )}
            >
              <span className="block overflow-hidden rounded-md border">
                <span
                  className="flex h-3.5 items-center justify-end px-1.5"
                  style={{ background: t.brandColor }}
                >
                  <span className="h-[3px] w-2 rounded-full bg-white/55" />
                </span>
                <span className="flex flex-col gap-[3px] bg-muted/50 p-1.5">
                  <span className="block h-[3.5px] w-3/4 rounded-full bg-border" />
                  <span className="block h-[3.5px] w-1/2 rounded-full bg-border" />
                  <span
                    className="mt-0.5 block h-2 w-6 rounded-sm"
                    style={{ background: t.accentColor }}
                  />
                </span>
              </span>
              <span className="flex items-center justify-between px-1 pt-1.5 text-[11.5px] font-medium">
                {t.label}
                {active && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </span>
              <span className="block px-1 pb-0.5 text-[11px] leading-snug text-muted-foreground">
                {t.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          A theme changes
        </p>
        <ScopeRow
          label="Layout"
          hint="Page layouts, product cards, header and footer"
          checked={scope.layout}
          onChange={(layout) => setScope((s) => ({ ...s, layout }))}
        />
        <ScopeRow
          label="Colours"
          hint="Brand and accent — turn off to keep yours"
          checked={scope.colors}
          onChange={(colors) => setScope((s) => ({ ...s, colors }))}
        />
        <p className="pt-0.5 text-[11px] leading-snug text-muted-foreground">
          Your slides, badges, links and menu are never changed by a theme.
        </p>
      </div>

      {applied && (
        <p className="text-[11px] text-muted-foreground">
          {drift === 0
            ? `Your store matches ${applied.label}.`
            : `${drift} ${drift === 1 ? "thing has" : "things have"} changed since you applied ${applied.label} — pick it again to reset them.`}
        </p>
      )}
    </div>
  );
}

function ScopeRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium leading-tight">{label}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
