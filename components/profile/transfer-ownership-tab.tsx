"use client";
// coding-standard: maintained

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Alert, AlertDescription } from "@/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import {
  AlertTriangle,
  ArrowRightLeft,
  Shield,
  Loader2,
  Crown,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizationUsers, useTransferOwnership } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Badge } from "@/ui/components/badge";
import { useRouter } from "next/dist/client/components/navigation";

interface OrganizationUser {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
}

export function TransferOwnershipTab() {
  const t = useTranslations("settings.profile.transferOwnership");
  const { user } = useAuthStore();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(
    null
  );
  const router = useRouter();

  const { mutate: fetchUsers, isPending: isLoadingUsers } =
    useOrganizationUsers();
  const { mutate: transferOwnership, isPending: isTransferring } =
    useTransferOwnership();

  // Check if current user is owner
  const isOwner = user?.organization?.ownerId === user?.id;

  useEffect(() => {
    if (isOwner) {
      fetchUsers(undefined, {
        onSuccess: (data) => {
          setUsers(data);
        },
        onError: () => {
          toast.error(t("loadUsersError"));
        },
      });
    }
  }, [isOwner, fetchUsers, t]);

  const handleTransfer = () => {
    const user = users.find((u) => u._id === selectedUserId);
    if (user) {
      setSelectedUser(user);
      setShowConfirmDialog(true);
    }
  };

  const confirmTransfer = () => {
    if (!selectedUserId) return;

    transferOwnership(selectedUserId, {
      onSuccess: () => {
        setShowConfirmDialog(false);
        setSelectedUserId("");
        setSelectedUser(null);
        // After a successful transfer, the current user is no longer the owner.
        // The Transfer tab will be filtered out of the sidebar, leaving the
        // page on a tab that no longer exists. Redirect to the Profile tab so
        // the UI lands on a valid view.
        // if (typeof window !== "undefined") {
        //   router.push("/profile#profile");
        //   // window.location.hash = "profile";

        // }
      },
    });
  };

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Crown className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t("notOwnerTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t("notOwnerDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Owner Info */}
      <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 mx-auto sm:mx-0">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">{t("currentOwner")}</p>
            <p className="font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Transfer Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowRightLeft className="h-4 w-4" />
          <span>{t("transferToNewOwner")}</span>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-owner">{t("selectNewOwner")}</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="new-owner" className="w-full">
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <SelectItem value="loading" disabled>
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("loadingUsers")}
                    </span>
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    {t("noOtherUsers")}
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || isLoadingUsers}
            className="w-full gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            {t("transferButton")}
          </Button>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>{t("warningTitle")}</strong> {t("warningBody")}
        </AlertDescription>
      </Alert>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmDescription")}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t("confirmWarning")}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{t("newOwnerLabel")}</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="capitalize">
                      {selectedUser.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedUser(null);
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTransfer}
              disabled={isTransferring}
              className="w-full sm:w-auto"
            >
              {isTransferring ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("confirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
