"use client";
// coding-standard: maintained

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetStorefrontSettings } from "@/services/api";
import { READY_MADE_THEMES, recommendedThemeFor } from "@/lib/storefront-themes";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { resolveDesign } from "@/lib/storefront-theme";
import { ThemeList } from "@/components/ecommerce/themes/theme-list";
import { ThemeStage } from "@/components/ecommerce/themes/theme-stage";

/**
 * Online Store → Themes. A whole look in one click, instead of asking a shop
 * owner to assemble one from eleven separate pickers.
 *
 * **Picker on the left, the merchant's own shop on the right.** The page used to
 * be a grid of four equal cards with the real preview behind a modal, which got
 * the emphasis backwards: a theme store exists to answer *what will my shop look
 * like*, and that answer was two clicks away and never on screen beside a second
 * theme to compare it with. One permanent preview also removes the flash the
 * modal had by construction — see `ThemeStage`.
 *
 * Nothing here writes. Apply routes to Customize with the theme staged as an
 * unsaved edit, so the merchant judges it with Save and Discard already up.
 */
export default function ThemesPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const activeId = settings?.theme?.appliedThemeId;
  const industry = useAuthStore((s) => s.user?.organization?.industry);
  const recommended = recommendedThemeFor(industry);

  /* Selection starts on nothing and RESOLVES to the live theme, rather than
     being seeded from `activeId` once it loads. Seeding would need an effect
     that fires after the settings query resolves, and that effect would fight a
     merchant who clicked a row while the request was still in flight. */
  const [picked, setPicked] = useState<string | null>(null);
  /* A shop with no theme applied opens on the one drawn for its trade, not on
     Classic. Classic is first in the catalogue because it is the reset, and
     previewing the reset to a merchant who came here to change their look shows
     them the shop they already have — the least persuasive frame available for
     a page whose whole job is to move them off the default. */
  const selected =
    READY_MADE_THEMES.find(
      (t) => t.id === (picked ?? activeId ?? recommended?.id),
    ) ?? READY_MADE_THEMES[0];

  // "Edited" compares only what a theme writes, so a merchant who rewrote their
  // footer — which no theme can touch — is not told their theme was changed.
  const modified = useThemeModified(settings);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your shop, in every look. Applying one changes colours, type and layout
          — never your products, pages or the words you wrote.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* The list is a row of chips above the preview until there is width for
           a column beside it. `lg` rather than `md`: the preview is a whole
           storefront, and taking 240px off a tablet leaves it too narrow to
           show what it is there to show. */
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
          <ThemeList
            themes={READY_MADE_THEMES}
            selectedId={selected.id}
            activeId={activeId}
            recommendedId={recommended?.id}
            modified={modified}
            onSelect={setPicked}
          />
          <ThemeStage
            theme={selected}
            settings={settings}
            active={selected.id === activeId}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Whether the saved look still matches the applied theme.
 *
 * Deliberately compares the SAVED settings rather than reusing the Customize
 * draft's `isThemeModified` — this page has no draft, and building one just to
 * answer a badge would run the whole seeding path for nothing.
 */
function useThemeModified(
  settings: ReturnType<typeof useGetStorefrontSettings>["data"],
): boolean {
  const applied = settings?.theme?.appliedThemeId;
  if (!applied) return false;
  const theme = READY_MADE_THEMES.find((t) => t.id === applied);
  if (!theme) return false;

  const saved = settings?.theme ?? {};
  const savedTemplates = (settings?.templates ?? {}) as Record<string, string>;
  if (saved.brandColor !== theme.brandColor) return true;
  if (saved.accentColor !== theme.accentColor) return true;
  if (JSON.stringify(resolveDesign(saved.design)) !== JSON.stringify(resolveDesign(theme.design))) {
    return true;
  }
  return Object.entries(theme.templates).some(
    ([key, value]) => savedTemplates[key] !== value,
  );
}
