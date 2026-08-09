"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import { useDeleteRole, useRoleUsage } from "@/services/api";
import type { OrganizationRole } from "@/types/users";

interface RoleDeleteDialogProps {
  role: OrganizationRole | null;
  /** Every other role in the org — the reassignment targets. */
  roles: OrganizationRole[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Delete a custom role, moving its holders first.
 *
 * The reassignment is not a courtesy. A user whose role no longer exists is
 * rejected on *every* request — they cannot log in, cannot reach billing, and
 * cannot get themselves out of it. The backend refuses the delete outright
 * while anyone holds the role; this dialog exists so the merchant meets that
 * rule as a choice rather than as an error.
 */
export function RoleDeleteDialog({
  role,
  roles,
  open,
  onOpenChange,
}: RoleDeleteDialogProps) {
  const t = useTranslations("settings.roles.delete");
  // Reset comes from the page remounting this with a fresh `key` per open, not
  // from an effect pushing props into state.
  const [reassignTo, setReassignTo] = useState("");

  const { data: usageData, isLoading: usageLoading } = useRoleUsage(
    open && role ? role.slug : null,
  );
  const usersCount = usageData?.data?.usersCount ?? 0;
  const deleteRole = useDeleteRole();

  // `super_admin` is never a valid target and the backend rejects it; the role
  // being deleted obviously cannot receive its own holders.
  const targets = roles
    .filter((r) => r.slug !== role?.slug && r.slug !== "super_admin")
    .map((r) => ({ value: r.slug, label: r.name }));

  const needsTarget = usersCount > 0;
  const canConfirm =
    !!role && !usageLoading && (!needsTarget || !!reassignTo) && !deleteRole.isPending;

  const handleConfirm = async () => {
    if (!role || !canConfirm) return;
    try {
      await deleteRole.mutateAsync({
        slug: role.slug,
        reassignTo: needsTarget ? reassignTo : undefined,
      });
      toast.success(
        needsTarget
          ? t("deletedAndMoved", { name: role.name, count: usersCount })
          : t("deleted", { name: role.name }),
      );
      onOpenChange(false);
    } catch (error) {
      // Covers the case this dialog cannot pre-empt: a holder with no location
      // at all, whom the target role would strand (REASSIGN_WOULD_STRAND_USERS).
      toast.error((error as Error).message || t("failed"));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("title", { name: role?.name ?? "" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {usageLoading
              ? t("checking")
              : needsTarget
                ? t("inUseDescription", { count: usersCount })
                : t("unusedDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {usageLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          needsTarget && (
            <div className="space-y-2">
              <Label htmlFor="reassign-to">{t("reassignLabel")}</Label>
              <SimpleSelect
                value={reassignTo}
                onValueChange={setReassignTo}
                options={targets}
                placeholder={t("reassignPlaceholder")}
              />
            </div>
          )
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog open on failure so the merchant can pick a
              // different target instead of losing the whole flow to a toast.
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={!canConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRole.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
