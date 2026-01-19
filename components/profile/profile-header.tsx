"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
} from "@/ui/components/card";
import { useAuthStore } from "@/stores/use-auth-store";
import { Mail, Phone, Building2, Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUpdateAvatar, useRemoveAvatar } from "@/hooks/queries/use-profile";
import { toast } from "sonner";
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

export function ProfileHeader() {
  const { user : storedUser } = useAuthStore();
  const [user, setUser] = useState({
    firstName: '-',
    lastName: '',
    avatar: {
      url: ''
    },
    role: '-',
    organization: {
      name: '-'
    },
    email: '-',
    phone: '-'
  });

  useEffect(() => {
    if (storedUser) {
      setUser(storedUser as typeof user);
    }
  }, [storedUser]);
  
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
    e.target.value = '';
  };

  return (
    <Card className="overflow-hidden border-2">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Avatar with upload/remove */}
          <div className="relative group cursor-pointer">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-all group-hover:ring-4 group-hover:ring-primary/30">
              <AvatarImage
                key={user.avatar?.url || 'no-avatar'}
                src={user.avatar?.url}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {/* Elegant hover overlay with single action button */}
            {! isUploading && <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {/* Main action button - upload/change */}
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full shadow-lg ml-2 absolute left-0 bottom-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || removeAvatar.isPending}
                title={user.avatar ? "Change photo" : "Upload photo"}
              >
                  <Camera className="h-4 w-4" />
              </Button>
              
              {/* Remove button - only show if avatar exists, positioned separately */}
              {user.avatar && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 rounded-full shadow-lg ml-2 absolute right-0 bottom-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemoveDialog(true);
                  }}
                  disabled={isUploading || removeAvatar.isPending}
                  title="Remove photo"
                >
                  {removeAvatar.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge variant={getRoleBadgeVariant()} className="capitalize w-fit mx-auto sm:mx-0">
                  {user.role.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 max-w-2xl">
              {/* Email */}
              <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {/* Phone */}
              {user.phone && (
                <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}

              {/* Organization */}
              <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.organization?.name}</span>
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
              Are you sure you want to remove your profile picture? You can always upload a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeAvatar.mutate(undefined, {
                onSuccess: () => setShowRemoveDialog(false),
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
