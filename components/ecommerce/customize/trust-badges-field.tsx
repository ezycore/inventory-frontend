"use client";
// coding-standard: maintained

import type { StorefrontTrustBadge } from "@/types";
import { Input } from "@/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Ban } from "lucide-react";
import { Icon as SfIcon, type IconName } from "@/components/storefront/sf-icons";
import { IconGrid } from "@/components/ecommerce/customize/icon-picker";
import { ICON_NAMES, NO_ICON } from "@/lib/storefront-builder/section-specs";

/** The icon a NEW promise starts with, by position. The picker offers every one of `ICON_NAMES`. */
export const BADGE_ICON_CHOICES: IconName[] = [
  "shield",
  "truck",
  "coins",
  "check",
  "star",
  "tag",
  "heart",
  "clock",
];
const BADGE_PLACEHOLDERS = [
  "100% authentic",
  "Same-day delivery",
  "Cash on delivery",
];

/** One badge row: icon picker in a compact popover + the badge text. */
function BadgeRow({
  badge,
  placeholder,
  onChange,
}: {
  badge: StorefrontTrustBadge;
  placeholder: string;
  onChange: (patch: Partial<StorefrontTrustBadge>) => void;
}) {
  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick badge icon"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground transition-colors hover:text-primary"
          >
            {badge.icon === NO_ICON ? (
              <Ban className="size-3.5" />
            ) : (
              <SfIcon name={(badge.icon as IconName) ?? "shield"} size={15} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-52 p-2">
          {/* The promises band's own list, "No icon" included, so a promise
              reads the same wherever it is drawn. Only the footer and the band
              draw a promise's glyph — the header's delivery pill and the hero
              card use its words alone — and both honour `NO_ICON`
              (`promiseIcon`). */}
          <IconGrid
            value={badge.icon}
            choices={ICON_NAMES}
            columns={4}
            allowNone
            onPick={(icon) => onChange({ icon })}
          />
        </PopoverContent>
      </Popover>
      <Input
        value={badge.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        maxLength={40}
        className="h-9"
      />
    </div>
  );
}

/** The merchant-managed promise list shared by trust bands and footer variants. */
export function TrustBadgesField({
  badges,
  setBadges,
}: {
  badges: StorefrontTrustBadge[];
  setBadges: (badges: StorefrontTrustBadge[]) => void;
}) {
  const patch = (index: number, value: Partial<StorefrontTrustBadge>) =>
    setBadges(
      badges.map((badge, current) =>
        current === index ? { ...badge, ...value } : badge,
      ),
    );
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= badges.length) return;
    const next = [...badges];
    [next[index], next[target]] = [next[target], next[index]];
    setBadges(next);
  };

  return (
    <div className="space-y-2">
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <BadgeRow
              badge={b}
              placeholder={BADGE_PLACEHOLDERS[i] ?? "Your promise"}
              onChange={(value) => patch(i, value)}
            />
          </div>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move promise up" className="h-9 w-9 rounded-md border disabled:opacity-40">↑</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === badges.length - 1} aria-label="Move promise down" className="h-9 w-9 rounded-md border disabled:opacity-40">↓</button>
          <button type="button" onClick={() => setBadges(badges.filter((_, current) => current !== i))} aria-label="Remove promise" className="h-9 w-9 rounded-md border text-destructive">×</button>
        </div>
      ))}
      {badges.length < 4 ? (
        <button type="button" onClick={() => setBadges([...badges, { text: "", icon: BADGE_ICON_CHOICES[badges.length % BADGE_ICON_CHOICES.length] }])} className="h-10 w-full rounded-md border border-dashed text-sm font-medium text-muted-foreground hover:text-foreground">
          Add promise
        </button>
      ) : null}
      {!badges.length ? <p className="text-xs text-muted-foreground">No promises are shown until you add one.</p> : null}
    </div>
  );
}
