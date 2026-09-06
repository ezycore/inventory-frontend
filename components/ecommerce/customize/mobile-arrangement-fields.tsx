"use client";
// coding-standard: maintained

import {
  MAX_SLOT_ACTIONS,
  type MobileActionId,
  type MobileChrome,
  type MobileRow,
} from "@/lib/storefront-mobile";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { Switch } from "@/ui/components/switch";
import { PartField } from "@/components/ecommerce/customize/part-group";
import { MobileSlotField } from "@/components/ecommerce/customize/mobile-slot-field";

/**
 * The arrangement half of Customize → Phone bar: what sits in each slot of the
 * top bar and how the bar itself is shaped.
 *
 * Split out of `parts/mobile-part.tsx` because the part answers two questions —
 * *which layout* (the picker and the phone artwork) and *how it is arranged* —
 * and the second is where all the interlocking rules live. Where two controls
 * cannot be set independently, the coupling is resolved by MOVING the
 * conflicting setting rather than by disabling a control: a segment a merchant
 * cannot press explains nothing about why.
 *
 * ⚠ **That rule assumes the merchant can SEE the move**, which is the whole
 * reason "Under the bar" is one control and not two. A move a merchant cannot
 * observe is not better than a disabled control — it is worse, because the
 * setting they lose is one they will not think to come back and check. When two
 * controls write one field, the fix is to stop having two controls; only keep
 * the move for couplings between genuinely separate fields, and put those
 * controls next to each other so the movement is on screen.
 */
export function MobileArrangementFields({
  chrome,
  patchMobile,
  barActions,
  disabledIds,
}: {
  chrome: MobileChrome;
  patchMobile: (p: Partial<MobileChrome>) => void;
  /** Every action a top-bar slot may hold. */
  barActions: MobileActionId[];
  /** Actions that would render nothing on this shop, and why. */
  disabledIds?: Partial<Record<MobileActionId, string>>;
}) {
  const m = chrome;
  return (
    <div className="space-y-3">
      <PartField
        label="Top bar — left of the logo"
        hint="Usually the menu button."
      >
        <MobileSlotField
          value={m.left}
          onChange={(left) => patchMobile({ left })}
          allow={barActions}
          max={MAX_SLOT_ACTIONS}
          disabledIds={disabledIds}
          emptyLabel="Nothing on the left."
        />
      </PartField>

      <PartField label="Top bar — right of the logo">
        <MobileSlotField
          value={m.right}
          onChange={(right) => patchMobile({ right })}
          allow={barActions}
          max={MAX_SLOT_ACTIONS}
          disabledIds={disabledIds}
          emptyLabel="Nothing on the right."
        />
      </PartField>

      <PartField label="Logo position">
        <SegmentedField
          label="Logo position"
          value={m.brand}
          onChange={(brand) =>
            patchMobile({
              brand: brand as "left" | "center",
              /* A centred logo has no room beside it, so it and an in-bar
                 search field are mutually exclusive. Resolved by MOVING the
                 field to its own row rather than by disabling one of the two
                 controls: a merchant who centres their logo still wants the
                 search box they chose, and a dead segment they cannot press
                 explains nothing about why. */
              ...(brand === "center" && m.searchInline
                ? { searchInline: false, row: "search" as const }
                : {}),
            })
          }
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Centred" },
          ]}
        />
      </PartField>

      {/* ONE control, because `row` is ONE field.
          This was two — a three-way Search picker with an "Own row" option, and
          a Category strip switch — both writing `chrome.row`, which draws a
          single row under the bar. So they silently fought: turning the strip on
          demoted Search from "Own row" to "Icon only", and choosing "Own row"
          switched the strip off, each time with nothing on screen to say it had
          happened. A merchant who set up a category strip and later moved search
          down would simply lose the strip and have no reason to look here.

          The file's rule is that a coupling is resolved by MOVING the conflicting
          setting rather than greying it out — and that is right, but it assumes
          the merchant can SEE the move. The better answer when two controls
          write one field is not to move carefully; it is to stop having two
          controls. "What is under the bar?" is a single question with three
          answers, which is exactly what `MobileRow` already says. */}
      <PartField
        label="Under the bar"
        hint="The row beneath your logo — one thing at a time."
      >
        <SegmentedField
          label="Under the bar"
          value={m.row}
          onChange={(row) =>
            patchMobile({
              row: row as MobileRow,
              /* Search cannot be in two places at once. This is the one coupling
                 left, and it is resolved the file's way — by moving — which is
                 safe here because the switch it moves is the very next control:
                 the merchant watches it turn off. */
              ...(row === "search" ? { searchInline: false } : {}),
            })
          }
          options={[
            { value: "none", label: "Nothing", description: "Just the bar" },
            { value: "search", label: "Search box", description: "A full-width field under the bar" },
            { value: "chips", label: "Categories", description: "A scrolling row of your collections" },
          ]}
        />
      </PartField>

      <PartField
        label="Search in the bar"
        hint={
          m.searchInline
            ? "The search box shares the bar with your logo."
            : "Beside the logo — the most compact place for it. Left off, search is an icon you add to a slot above."
        }
      >
        <Switch
          checked={m.searchInline}
          onCheckedChange={(searchInline) =>
            patchMobile({
              searchInline,
              ...(searchInline
                ? {
                    // A field in the bar needs the logo out of the middle —
                    // the mirror of the rule in Logo position above.
                    brand: "left" as const,
                    // ...and it cannot also own the row below.
                    ...(m.row === "search" ? { row: "none" as const } : {}),
                  }
                : {}),
            })
          }
          aria-label="Put the search box in the bar"
        />
      </PartField>

      <PartField label="Bar follows the page" hint="Stays on screen while scrolling.">
        <Switch
          checked={m.sticky}
          onCheckedChange={(sticky) => patchMobile({ sticky })}
          aria-label="Keep the bar on screen while scrolling"
        />
      </PartField>

      <PartField label="Logo height" hint="Pixels tall in the phone bar.">
        <NumberField
          value={m.logoHeight}
          onChange={(v) => patchMobile({ logoHeight: v ?? 34 })}
          min={18}
          max={60}
          precision={0}
          showSteppers
        />
      </PartField>
    </div>
  );
}
