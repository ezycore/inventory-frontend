"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { usePermissionCatalog, useCreateRole, useUpdateRole } from "@/services/api";
import type { OrganizationRole } from "@/types/users";
import { PermissionPicker } from "./permission-picker";

interface RoleFormSheetProps {
  /** `null` = create; a role = edit. Only custom roles are ever passed here. */
  role: OrganizationRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Author or edit a custom role.
 *
 * The slug is not editable and not shown as a field: users carry it on
 * `user.role`, so the backend freezes it at create and a rename only moves the
 * label. Surfacing it as an input would imply otherwise.
 */
export function RoleFormSheet({ role, open, onOpenChange }: RoleFormSheetProps) {
  const t = useTranslations("settings.roles.form");
  const isEdit = !!role;

  // Seeded once per mount. The page remounts this with a fresh `key` every time
  // it opens, which is what resets the form — an effect that pushed props into
  // state would re-render twice on open and drift from the props on the second.
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);

  // Only fetch the catalog once the builder is actually open — it is plan-shaped
  // and effectively static, so there is nothing to prefetch it for.
  const { data: catalogData, isLoading: catalogLoading } = usePermissionCatalog({
    enabled: open,
  });
  const catalog = catalogData?.data;

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isSaving = createRole.isPending || updateRole.isPending;

  const grantable = useMemo(
    () => new Set(catalog?.grantable ?? []),
    [catalog],
  );

  /**
   * Permissions the role already holds but the plan no longer grants. The
   * backend grandfathers exactly these on update, so they stay checked and
   * stay submitted — dropping them silently would cost the merchant access
   * they may get back when the plan changes.
   */
  const grandfathered = useMemo(
    () => (role?.permissions ?? []).filter((p) => !grantable.has(p)),
    [role, grantable],
  );

  const canSubmit = name.trim().length > 0 && selected.length > 0 && !isSaving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: selected,
    };

    try {
      if (isEdit) {
        await updateRole.mutateAsync({ slug: role.slug, data: payload });
        toast.success(t("updated", { name: payload.name }));
      } else {
        await createRole.mutateAsync(payload);
        toast.success(t("created", { name: payload.name }));
      }
      onOpenChange(false);
    } catch (error) {
      // The backend refuses rather than filters — a name collision, the 50-role
      // cap, a permission above the requester's own grant. Each carries a
      // message worth showing verbatim instead of a generic failure.
      toast.error((error as Error).message || t("saveFailed"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:w-[560px] sm:max-w-[560px]">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {isEdit ? t("editTitle") : t("createTitle")}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t("editDescription", { slug: role.slug }) : t("createDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">{t("nameLabel")}</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">{t("descriptionLabel")}</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={500}
              rows={2}
            />
          </div>

          <PermissionPicker
            catalog={catalog}
            isLoading={catalogLoading}
            selected={selected}
            grandfathered={grandfathered}
            onChange={setSelected}
          />
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? t("save") : t("create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
