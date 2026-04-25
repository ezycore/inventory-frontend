"use client";

import { useRemoveAvatar, useUpdateAvatar } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Building2,
  Camera,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Shield,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function ProfileHeader() {
  const { user: storedUser } = useAuthStore();
  const user = storedUser || {
    firstName: "-",
    lastName: "",
    avatar: {
      url: "",
    },
    role: "-",
    organization: {
      name: "-",
    },
    email: "-",
    phone: "-",
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();

  const getInitials = () => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const getRoleBadgeVariant = () => {
    switch (user.role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    updateAvatar.mutate(formData, {
      onSettled: () => setIsUploading(false),
    });

    // Clear the input so same file can be selected again
    e.target.value = "";
  };

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Banner */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h20v20H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M10%2010m-1%200a1%201%200%201%200%202%200a1%201%200%201%200%20-2%200%22%20fill%3D%22rgba(255%2C255%2C255%2C0.1)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            {/* Avatar with upload/remove */}
            <div className="relative group mx-auto sm:mx-0 shrink-0">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl ring-2 ring-background">
                <AvatarImage
                  key={user.avatar?.url || "no-avatar"}
                  src={user.avatar?.url}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              {(isUploading || removeAvatar.isPending) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Hover overlay with actions */}
              {!isUploading && !removeAvatar.isPending && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    title={user.avatar ? "Change photo" : "Upload photo"}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>

                  {user.avatar && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={() => setShowRemoveDialog(true)}
                      title="Remove photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-4 text-center sm:text-left space-y-3 md:space-y-1">
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {user.firstName} {user.lastName}
                  </h1>
                  <Badge
                    variant={getRoleBadgeVariant()}
                    className="capitalize w-fit mx-auto sm:mx-0 gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {user.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[150px]">
                    {user.organization?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Avatar Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile picture? You can
              always upload a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                removeAvatar.mutate(undefined, {
                  onSuccess: () => setShowRemoveDialog(false),
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
