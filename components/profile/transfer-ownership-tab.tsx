"use client";

import { useState, useEffect } from "react";
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
import { UserCog, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useOrganizationUsers,
  useTransferOwnership,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";

interface OrganizationUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function TransferOwnershipTab() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(
    null
  );

  const { mutate: fetchUsers, isPending: isLoadingUsers } =
    useOrganizationUsers();
  const { mutate: transferOwnership, isPending: isTransferring } =
    useTransferOwnership();

  // Check if current user is owner
  const isOwner =
    user?.organization?.ownerId === user?.id;

  useEffect(() => {
    if (isOwner) {
      fetchUsers(undefined, {
        onSuccess: (data) => {
          setUsers(data);
        },
        onError: () => {
          toast.error("Failed to load organization users.");
        },
      });
    }
  }, [isOwner, fetchUsers]);

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
      },
    });
  };

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only the organization owner can transfer ownership. If you need to
            transfer ownership, please contact the current owner.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transfer Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/20 p-3">
            <UserCog className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Transfer Ownership</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Transfer the ownership of this organization to another user. The
              new owner will have full control over the organization.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-owner">Select New Owner</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="new-owner">
                <SelectValue placeholder="Choose a user to transfer ownership to" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Loading users...
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    No other users in organization
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email} • {user.role}
                        </span>
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
            className="w-full"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer Ownership
          </Button>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Transferring ownership is a permanent
          action. You will lose owner privileges and the new owner will have
          full control over the organization. The new owner will automatically
          be assigned the admin role if they don&apos;t already have it.
        </AlertDescription>
      </Alert>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Ownership Transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to transfer ownership to this user?
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. You will no longer be the owner
                  of this organization.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-muted p-4">
                <Label className="text-xs text-muted-foreground">
                  New Owner
                </Label>
                <div className="mt-2">
                  <p className="font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Role: {selectedUser.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTransfer}
              disabled={isTransferring}
            >
              {isTransferring ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
