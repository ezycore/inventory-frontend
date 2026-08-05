"use client";
// coding-standard: maintained

import type { StorefrontTrustBadge } from "@/types";
import { Input } from "@/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { cn } from "@/ui/lib/utils";
import { Icon as SfIcon, type IconName } from "@/components/storefront/sf-icons";

// Trust-badge editor (Rich footer). Rows seed empty with these defaults as
// placeholders/icons; unset rows fall back to the storefront's localized copy.
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
export const DEFAULT_BADGES: StorefrontTrustBadge[] = [
  { text: "", icon: "shield" },
  { text: "", icon: "truck" },
  { text: "", icon: "coins" },
];
const BADGE_PLACEHOLDERS = [
  "100% authentic",
  "Same-day delivery",
  "Cash on delivery",
];

const SUBTITLE_PLACEHOLDERS = [
  "Inside Dhaka in 24 hours",
  "7-day easy returns",
  "Pay when it arrives",
];

/** One badge row: icon picker in a compact popover + the badge text. */
function BadgeRow({
  badge,
  placeholder,
  subtitlePlaceholder,
  showSubtitle,
  onChange,
}: {
  badge: StorefrontTrustBadge;
  placeholder: string;
  subtitlePlaceholder: string;
  /** The second line only renders on the home row — hidden when it can't show. */
  showSubtitle: boolean;
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
            <SfIcon name={(badge.icon as IconName) ?? "shield"} size={15} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-auto p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {BADGE_ICON_CHOICES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange({ icon: name })}
                aria-label={name}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                  badge.icon === name
                    ? "border-primary text-primary ring-2 ring-primary/30"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <SfIcon name={name} size={15} />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Input
          value={badge.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={placeholder}
          maxLength={40}
          className="h-9"
        />
        {showSubtitle && (
          <Input
            value={badge.subtitle ?? ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder={subtitlePlaceholder}
            maxLength={60}
            className="h-8 text-[13px]"
          />
        )}
      </div>
    </div>
  );
}

/**
 * The three trust promises, shown by the Rich footer (one line each) and the
 * home delivery/returns row (which adds the second line). One editor for both:
 * they are the same promises, and a merchant asked to write them twice would
 * rightly wonder which set the shop uses.
 */
export function TrustBadgesField({
  badges,
  setBadge,
  showSubtitle = false,
}: {
  badges: StorefrontTrustBadge[];
  setBadge: (i: number, patch: Partial<StorefrontTrustBadge>) => void;
  /** Show the second line — only the home trust row renders it. */
  showSubtitle?: boolean;
}) {
  return (
    <div className="space-y-2">
      {badges.map((b, i) => (
        <BadgeRow
          key={i}
          badge={b}
          placeholder={BADGE_PLACEHOLDERS[i] ?? "Badge text"}
          subtitlePlaceholder={SUBTITLE_PLACEHOLDERS[i] ?? "Second line"}
          showSubtitle={showSubtitle}
          onChange={(patch) => setBadge(i, patch)}
        />
      ))}
    </div>
  );
}
