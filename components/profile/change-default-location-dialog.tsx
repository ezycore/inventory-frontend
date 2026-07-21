"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useMyLocations, useUpdateMyDefaultLocation } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { MapPin, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@/ui/components/label";

export function ChangeDefaultLocationDialog() {
  const t = useTranslations("settings.profile.changeLocation");
  const { user, setActiveLocation, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: locationsData, isLoading } = useMyLocations();
  const updateDefaultMutation = useUpdateMyDefaultLocation();
  const [open, setOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const locations = locationsData?.data || [];

  const hasAllLocationAccess =
    !!user?.permissions?.includes("locations.all") ||
    !!user?.permissions?.includes("locations.manage");

  const handleSave = async () => {
    if (!selectedLocationId) {
      toast.error(t("selectRequired"));
      return;
    }

    try {
      await updateDefaultMutation.mutateAsync(selectedLocationId);
      // 1. Update user.defaultLocationId in the auth store so the Default
      //    Location card on the profile page refreshes immediately.
      updateUser({ defaultLocationId: selectedLocationId });
      // 2. Also sync the active-location cookie/state.
      setActiveLocation(selectedLocationId);
      // 3. Evict the cache — see the note in `ui/components/LocationSwitcher.tsx`:
      //    invalidating leaves inactive queries holding the previous location's rows.
      queryClient.clear();
      setOpen(false);
    } catch {
      // Error already handled by mutation
    }
  };

  return locations.length === 1 ? (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <Info className="h-4 w-4 shrink-0" />
      <span>{t("onlyOneLocation")}</span>
    </div>
  ) : (
    <Dialog open={open} onOpenChange={() => {
      setOpen((prev) => !prev);
      if(!open) {
        // Reset selection when opening the dialog
        setSelectedLocationId(user?.defaultLocationId || "");
      }
    }
    }>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{t("changeLocation")}</span>
          <span className="sm:hidden">{t("change")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasAllLocationAccess && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span>
                {t("allAccessHint")}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location-select" className="text-sm font-medium">
              {t("selectLocation")}
            </Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={isLoading}
            >
              <SelectTrigger id="location-select">
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location._id} value={location._id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{location.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({location.locationType})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedLocationId || updateDefaultMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateDefaultMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
