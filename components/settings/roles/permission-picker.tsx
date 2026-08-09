"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Globe, Lock } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Checkbox } from "@/ui/components/checkbox";
import { Label } from "@/ui/components/label";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import {
  formatPermission,
  getCategoryConfig,
} from "@/components/shared/permissions";
import { cn } from "@/ui/lib/utils";
import type { PermissionCatalog } from "@/types/api";

/**
 * Erases location scoping for everyone holding the role, so it is pulled out of
 * its group and labelled rather than sitting as one checkbox among five. The
 * backend refuses it from a requester who does not hold it themselves.
 */
const ALL_LOCATIONS = "locations.all";

interface PermissionPickerProps {
  catalog?: PermissionCatalog;
  isLoading: boolean;
  selected: string[];
  /** Held-but-off-plan permissions: checked, submitted, not removable by the plan. */
  grandfathered: string[];
  onChange: (next: string[]) => void;
}

export function PermissionPicker({
  catalog,
  isLoading,
  selected,
  grandfathered,
  onChange,
}: PermissionPickerProps) {
  const t = useTranslations("settings.roles.form");
  const tPermissions = useTranslations("settings.permissions");

  const selectedSet = new Set(selected);
  const grandfatheredSet = new Set(grandfathered);

  const toggle = (permission: string, checked: boolean) => {
    onChange(
      checked
        ? [...selected, permission]
        : selected.filter((p) => p !== permission),
    );
  };

  const toggleModule = (permissions: string[], checked: boolean) => {
    const rest = selected.filter((p) => !permissions.includes(p));
    onChange(checked ? [...rest, ...permissions] : rest);
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t("permissionsLabel")}</Label>
        <Badge variant="outline" className="tabular-nums">
          {t("selectedCount", { count: selected.length })}
        </Badge>
      </div>

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
          disabled={!allLocationsAvailable}
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
        const allChosen = chosen.length === permissions.length;

        return (
          <div
            key={module.key}
            className={cn(
              "overflow-hidden rounded-xl border-2",
              config.color,
              !module.available && "opacity-70",
            )}
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
                  disabled={!module.available}
                  onCheckedChange={(checked) =>
                    toggleModule(permissions, checked === true)
                  }
                />
                <span className={cn("truncate text-sm font-semibold", config.textColor)}>
                  {config.name}
                </span>
              </label>

              {module.available ? (
                <Badge variant="secondary" className="h-5 shrink-0 px-2 text-xs tabular-nums">
                  {chosen.length}/{permissions.length}
                </Badge>
              ) : (
                // Listed, not hidden: a merchant who cannot find `storefront`
                // at all assumes a bug, where "not on your plan" is an answer.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 shrink-0 gap-1 px-2 text-xs">
                      <Lock className="h-3 w-3" />
                      {t("notOnPlan")}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{t("notOnPlanTooltip")}</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="grid gap-1 bg-card/50 p-2 sm:grid-cols-2">
              {permissions.map((permission) => {
                const isGrandfathered = grandfatheredSet.has(permission);
                return (
                  <label
                    key={permission}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedSet.has(permission)}
                      // A held permission stays editable even off-plan: the
                      // backend grandfathers it, and freezing the checkbox
                      // would strand the merchant with no way to remove it.
                      disabled={!module.available && !isGrandfathered}
                      onCheckedChange={(checked) =>
                        toggle(permission, checked === true)
                      }
                    />
                    <span className="truncate">{formatPermission(permission)}</span>
                    {isGrandfathered && (
                      <Badge variant="outline" className="ml-auto h-4 px-1 text-[10px]">
                        {t("grandfathered")}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
