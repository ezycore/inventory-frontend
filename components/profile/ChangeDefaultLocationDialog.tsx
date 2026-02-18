"use client";

import { useMyLocations, useUpdateMyDefaultLocation } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
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
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/ui/components/label";

export function ChangeDefaultLocationDialog() {
  const { user } = useAuthStore();
  const { data: locationsData, isLoading } = useMyLocations();
  const updateDefaultMutation = useUpdateMyDefaultLocation();
  const [open, setOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const locations = locationsData?.data || [];

  // Admin has access to all locations
  const isAdmin = user?.role === "admin";

  const handleSave = async () => {
    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }

    try {
      await updateDefaultMutation.mutateAsync(selectedLocationId);
      setOpen(false);
      // Reload the page to update the auth context
      window.location.reload();
    } catch {
      // Error already handled by mutation
    }
  };

  return locations.length === 1 ? (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <Info className="h-4 w-4 shrink-0" />
      <span>You only have access to one location.</span>
    </div>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Change Location</span>
          <span className="sm:hidden">Change</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Default Location</DialogTitle>
          <DialogDescription>
            Select your default location for when you log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isAdmin && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <span>
                As an admin, you have access to all locations. Your default is
                used on first login.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location-select" className="text-sm font-medium">
              Select Location
            </Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={isLoading}
            >
              <SelectTrigger id="location-select">
                <SelectValue placeholder="Choose a location..." />
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
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedLocationId || updateDefaultMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateDefaultMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
