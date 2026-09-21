"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { CopyField } from "@/ui/components/copy";
import EmptyState from "@/ui/components/EmptyState";
import { Input } from "@/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { StatStrip, StatTile } from "@/components/shared/detail-sheet";
import {
  formatPermission,
  getCategoryConfig,
  groupPermissions,
  PermissionGroupCard,
  useVisiblePermissions,
} from "@/components/shared/permissions";
import type { Translator } from "@/i18n/config";
import type { OrganizationRole } from "@/types/users";

interface RoleDetailsSheetProps {
  role: OrganizationRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Matches the full key, the formatted action, or the category display name. */
function matchesQuery(permission: string, query: string, tCategories: Translator) {
  return (
    permission.toLowerCase().includes(query) ||
    formatPermission(permission).toLowerCase().includes(query) ||
    getCategoryConfig(permission.split(".")[0], tCategories).name.toLowerCase().includes(query)
  );
}

/** Read-only drawer showing a role's metadata and grouped permissions. */
export function RoleDetailsSheet({
  role,
  open,
  onOpenChange,
}: RoleDetailsSheetProps) {
  const t = useTranslations("settings.roles.details");
  const tTable = useTranslations("settings.roles.table");
  const tPermissions = useTranslations("settings.permissions");
  const [query, setQuery] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  // Modules this workspace has switched off are left out, as in the builder.
  // The role still holds them; they come back when the feature does.
  const permissions = useVisiblePermissions(role?.permissions ?? []);
  const totalCategories = Object.keys(groupPermissions(permissions)).length;

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = trimmedQuery
    ? permissions.filter((permission) => matchesQuery(permission, trimmedQuery, tPermissions))
    : permissions;
  const groups = groupPermissions(filtered);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:w-[560px] sm:max-w-[560px]">
        <SheetHeader className="border-b">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-8">
            <ShieldCheck className="h-5 w-5" />
            {role?.name}
            {role && (
              <Badge variant={role.source === "system" ? "secondary" : "outline"}>
                {role.source === "system" ? tTable("system") : tTable("missionControl")}
              </Badge>
            )}
            {role?.locked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                {t("locked")}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {role?.description || t("noDescription")}
          </SheetDescription>
          {role && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {t("slug")}: <span className="font-mono text-foreground">{role.slug}</span>
              <CopyField value={role.slug} showValue={false} />
            </div>
          )}
        </SheetHeader>

        {role && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <StatStrip>
              <StatTile label={t("permissionsStat")} value={permissions.length} />
              <StatTile label={t("categoriesStat")} value={totalCategories} />
              <StatTile
                label={t("assignableStat")}
                value={role.assignable ? t("yes") : t("no")}
                valueClassName={
                  role.assignable ? "text-green-600" : "text-muted-foreground"
                }
              />
            </StatStrip>

            {permissions.length === 0 ? (
              <EmptyState
                compact
                icon={Lock}
                title={t("noPermissionsTitle")}
                description={t("noPermissionsDescription")}
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("filterPlaceholder")}
                    className="pl-8"
                  />
                </div>

                {Object.keys(groups).length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t("noMatch", { query: query.trim() })}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groups).map(([category, perms]) => (
                      <PermissionGroupCard
                        key={category}
                        category={category}
                        permissions={perms}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
