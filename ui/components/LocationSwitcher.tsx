"use client";
import { sanitize, useMyLocations, useQueryClient } from "@/hooks";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Check, ChevronDown, MapPin, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { toast } from "sonner";

export function LocationSwitcher() {
  const { data: locationsData, isLoading } = useMyLocations();
  const locations = useMemo(() => locationsData?.data || [], [locationsData]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get location state from auth store
  const { user, activeLocationId, setActiveLocation } = useAuthStore();

  // Get all accessible locations - useMyLocations already filters by user access
  const accessibleLocations = useMemo(() => {
    return sanitize(locations, "array").map((loc) => ({
      id: loc._id,
      name: loc.name,
      isDefault: loc.default,
    }));
  }, [locations]);

  // Get current active location
  const currentLocation = (() => {
    if (activeLocationId) {
      const found = accessibleLocations.find((loc) => loc.id === activeLocationId);
      if (found) return found;
    }

    // Fallback to user's default location
    if (user?.defaultLocationId) {
      const found = accessibleLocations.find(
        (loc) => loc.id === user.defaultLocationId
      );
      if (found) return found;
    }

    // Fallback to org default location or first accessible
    const defaultLoc = accessibleLocations.find((loc) => loc.isDefault);
    return defaultLoc || accessibleLocations[0];
  })();

  // Initialize active location if not set
  useEffect(() => {
    if (!activeLocationId && currentLocation?.id) {
      setActiveLocation(currentLocation.id);
    }
  }, [activeLocationId, currentLocation?.id, setActiveLocation]);

  const handleLocationSelect = async (location: { id: string; name: string }) => {
    try {
      setActiveLocation(location.id);
      setOpen(false);
      // Evict, don't invalidate. `invalidateQueries` refetches only the *active* queries;
      // inactive ones keep the previous location's rows for their gcTime and render them
      // synchronously on the next mount — the old warehouse's numbers under the new
      // warehouse's heading. Location is request-scope state (the X-Active-Location header),
      // so nothing in the cache survives a switch.
      queryClient.clear();
      toast.success(`Switched to location: ${location.name}`);
    } catch (error) {
      toast.error("Failed to switch location");
    }
  };

  // Don't show if loading or no locations available
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        disabled
        className="group relative h-11 gap-2 px-4 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-sm"
      >
        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
        <span className="text-sm font-semibold text-gray-900">Loading...</span>
      </Button>
    );
  }

  const showSwitcher = accessibleLocations.length > 0;

  if (!showSwitcher) {
    return null;
  }

  return (
    <Popover open={accessibleLocations.length > 1 ? open : false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="group relative h-9 gap-2 px-4 rounded-full border border-gray-400 backdrop-blur-sm hover:border-gray-300 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">
                {currentLocation?.name || "Select Location"}
              </span>
            </div>
          </div>
          {accessibleLocations.length > 1 && (
            <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-2 mt-2 rounded-2xl border border-gray-200/60 backdrop-blur-xl shadow-2xl"
        align="end"
      >
        <div className="px-3 py-2 mb-1">
          <h4 className="text-sm font-semibold">
            Select Location
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose your active location for operations
          </p>
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {accessibleLocations.map((location) => (
            <Button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              variant="ghost"
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100/80 dark:hover:bg-gray-600 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {location.name}
                  </span>
                  {location.isDefault && (
                    <span className="text-xs">Default</span>
                  )}
                </div>
              </div>
              {currentLocation?.id === location.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
