"use client";
// coding-standard: maintained
import { sanitize, useMyLocations, useQueryClient } from "@/hooks";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Check, ChevronDown, MapPin, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { toast } from "sonner";

export function LocationSwitcher() {
  const t = useTranslations("layout.locationSwitcher");
  const tCommon = useTranslations("common");
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

  const handleLocationSelect = (location: { id: string; name: string }) => {
    try {
      setActiveLocation(location.id);
      setOpen(false);
      // Evict, don't invalidate. `invalidateQueries` refetches only the *active* queries;
      // inactive ones keep the previous location's rows for their gcTime and render them
      // synchronously on the next mount — the old warehouse's numbers under the new
      // warehouse's heading. Location is request-scope state (the X-Active-Location header),
      // so nothing in the cache survives a switch.
      queryClient.clear();
      toast.success(t("switched", { name: location.name }));
    } catch {
      toast.error(t("switchFailed"));
    }
  };

  // Don't show if loading or no locations available
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        disabled
        className="group relative h-11 gap-2 px-4 rounded-full border border-border bg-card/80 backdrop-blur-sm"
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm font-semibold">{tCommon("empty.loading")}</span>
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
          title={currentLocation?.name}
          // A long location name is the widest thing in the header, and `Button`
          // is `whitespace-nowrap shrink-0` — so the cap has to hold at *every*
          // breakpoint. Uncapping it above `sm` sized the trigger to the full
          // name and shoved the breadcrumbs off-screen.
          className="group relative h-9 min-w-0 max-w-[40vw] shrink gap-2 px-4 rounded-full border border-border backdrop-blur-sm transition-all duration-300 hover:border-primary/40 sm:max-w-[200px] lg:max-w-[260px]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative shrink-0">
              <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
            </div>
            {/* max-w-full is load-bearing: `items-start` means the span is not
                stretched, so it sizes to max-content and spills out of the
                capped button — `truncate` alone never fires. */}
            <div className="flex min-w-0 flex-col items-start">
              <span className="max-w-full truncate text-sm font-semibold">
                {currentLocation?.name || t("title")}
              </span>
            </div>
          </div>
          {accessibleLocations.length > 1 && (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-2 mt-2 rounded-2xl border border-border backdrop-blur-xl shadow-2xl"
        align="end"
      >
        <div className="px-3 py-2 mb-1">
          <h4 className="text-sm font-semibold">{t("title")}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {accessibleLocations.map((location) => (
            <Button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              variant="ghost"
              // h-auto: a default location stacks two lines (name + badge), which
              // the size variant's fixed `h-9` clips. Let the padding set the height.
              className="w-full flex h-auto items-center justify-between px-3 py-2.5 transition-all duration-200 group"
            >
              {/* min-w-0 all the way down, or `truncate` never fires and the
                  name overflows the fixed-width popover. */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex min-w-0 flex-col items-start">
                  <span
                    className="max-w-full truncate text-sm font-medium"
                    title={location.name}
                  >
                    {location.name}
                  </span>
                  {location.isDefault && (
                    <span className="text-xs text-muted-foreground">{tCommon("status.default")}</span>
                  )}
                </div>
              </div>
              {currentLocation?.id === location.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
