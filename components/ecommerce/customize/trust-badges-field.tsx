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

/** The three trust badges the Rich footer shows above its link columns. */
export function TrustBadgesField({
  badges,
  setBadge,
}: {
  badges: StorefrontTrustBadge[];
  setBadge: (i: number, patch: Partial<StorefrontTrustBadge>) => void;
}) {
  return (
    <div className="space-y-2">
      {badges.map((b, i) => (
        <BadgeRow
          key={i}
          badge={b}
          placeholder={BADGE_PLACEHOLDERS[i] ?? "Badge text"}
          onChange={(patch) => setBadge(i, patch)}
        />
      ))}
    </div>
  );
}
