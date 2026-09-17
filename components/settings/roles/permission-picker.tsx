"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Checkbox } from "@/ui/components/checkbox";
import { Label } from "@/ui/components/label";
import { Skeleton } from "@/ui/components/skeleton";
import {
  formatPermission,
  getCategoryConfig,
} from "@/components/shared/permissions";
import { cn } from "@/ui/lib/utils";
import type { PermissionCatalog } from "@/types/api";
import { canTickPermission } from "./grant-rule";

/**
 * Erases location scoping for everyone holding the role, so it is pulled out of
 * its group and labelled rather than sitting as one checkbox among five. The
 * backend refuses it from a requester who does not hold it themselves.
 */
const ALL_LOCATIONS = "locations.all";

interface PermissionPickerProps {
  /**
   * Already filtered by the backend: a module whose features are switched off
   * is not in it, so nothing here needs a "not on your plan" state.
   */
  catalog?: PermissionCatalog;
  isLoading: boolean;
  /**
   * Everything the role holds, including permissions the catalog hides. Those
   * are never rendered and never touched by a toggle, so they go back to the
   * API as they came — a switched-off feature must not cost the role a grant.
   */
  selected: string[];
  /** The signed-in editor's own permissions — the ceiling on what they may add. */
  editorPermissions: string[];
  /** What the role held when the form opened; keeping one is not granting it. */
  originalPermissions: string[];
  onChange: (next: string[]) => void;
}

export function PermissionPicker({
  catalog,
  isLoading,
  selected,
  editorPermissions,
  originalPermissions,
  onChange,
}: PermissionPickerProps) {
  const t = useTranslations("settings.roles.form");
  const tPermissions = useTranslations("settings.permissions");

  const selectedSet = new Set(selected);
  const editorSet = new Set(editorPermissions);
  const originalSet = new Set(originalPermissions);
  const canTick = (permission: string) =>
    canTickPermission(permission, editorSet, originalSet);

  const toggle = (permission: string, checked: boolean) => {
    onChange(
      checked
        ? [...selected, permission]
        : selected.filter((p) => p !== permission),
    );
  };

  // Ticking a module adds only what the editor may tick; unticking clears the
  // whole module, because removing is never clamped.
  const toggleModule = (permissions: string[], checked: boolean) => {
    const rest = selected.filter((p) => !permissions.includes(p));
    const kept = checked
      ? permissions.filter((p) => selectedSet.has(p) || canTick(p))
      : [];
    onChange([...rest, ...kept]);
  };

  if (isLoading || !catalog) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const allLocationsAvailable = catalog.grantable.includes(ALL_LOCATIONS);
  // Counts what the merchant can see, not the hidden grants riding along.
  const selectedVisible = catalog.grantable.filter((p) => selectedSet.has(p)).length;
  const anyLocked = catalog.grantable.some((p) => !selectedSet.has(p) && !canTick(p));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t("permissionsLabel")}</Label>
        <Badge variant="outline" className="tabular-nums">
          {t("selectedCount", { count: selectedVisible })}
        </Badge>
      </div>
      {anyLocked && (
        <p className="text-xs text-muted-foreground">{t("lockedHint")}</p>
      )}

      {/* Pulled out of the `locations` group deliberately — see ALL_LOCATIONS. */}
      <label
        className={cn(
          "flex items-start gap-3 rounded-xl border-2 p-3",
          selectedSet.has(ALL_LOCATIONS)
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            : "border-border",
          !allLocationsAvailable && "opacity-60",
        )}
      >
        <Checkbox
          checked={selectedSet.has(ALL_LOCATIONS)}
          disabled={
            !allLocationsAvailable ||
            (!selectedSet.has(ALL_LOCATIONS) && !canTick(ALL_LOCATIONS))
          }
          onCheckedChange={(checked) => toggle(ALL_LOCATIONS, checked === true)}
          className="mt-0.5"
        />
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Globe className="h-3.5 w-3.5" />
            {t("allLocationsTitle")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("allLocationsDescription")}
          </p>
        </div>
      </label>

      {catalog.modules.map((module) => {
        const config = getCategoryConfig(module.key, tPermissions);
        const permissions = module.permissions.filter((p) => p !== ALL_LOCATIONS);
        if (permissions.length === 0) return null;

        const chosen = permissions.filter((p) => selectedSet.has(p));
        // "All" means all the editor could have ticked — a locked permission
        // must not leave the module checkbox stuck unticked forever.
        const tickable = permissions.filter((p) => selectedSet.has(p) || canTick(p));
        const allChosen = chosen.length > 0 && chosen.length === tickable.length;

        return (
          <div
            key={module.key}
            className={cn("overflow-hidden rounded-xl border-2", config.color)}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2",
                config.bgColor,
              )}
            >
              <label className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={allChosen}
                  disabled={tickable.length === 0}
                  onCheckedChange={(checked) =>
                    toggleModule(permissions, checked === true)
                  }
                />
                <span className={cn("truncate text-sm font-semibold", config.textColor)}>
                  {config.name}
                </span>
              </label>

              <Badge variant="secondary" className="h-5 shrink-0 px-2 text-xs tabular-nums">
                {chosen.length}/{permissions.length}
              </Badge>
            </div>

            <div className="grid gap-1 bg-card/50 p-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={permission}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50",
                    !selectedSet.has(permission) && !canTick(permission) && "opacity-50",
                  )}
                >
                  <Checkbox
                    checked={selectedSet.has(permission)}
                    disabled={!selectedSet.has(permission) && !canTick(permission)}
                    onCheckedChange={(checked) => toggle(permission, checked === true)}
                  />
                  <span className="truncate">{formatPermission(permission)}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
