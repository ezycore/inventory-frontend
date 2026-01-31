"use client";

import { useMyLocations, useUpdateMyDefaultLocation } from "@/services/api/queries";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return locations.length === 1 ? (
    <>
      {
        <div className="text-sm text-muted-foreground">
          You only have access to one location. Your default location cannot be
          changed.
        </div>
      }
    </>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          Change Default Location
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Default Location</DialogTitle>
          <DialogDescription>
            Select your default location. This will be used when you log in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isAdmin && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              As an admin, you have access to all locations. Your default
              location is used when you first log in.
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Location</label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a location..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location._id} value={location._id}>
                    {location.name} ({location.locationType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedLocationId || updateDefaultMutation.isPending}
            >
              {updateDefaultMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
