"use client";
import { sanitize, useLocations } from "@/hooks";
import { Location } from "@/types";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function LocationSwitcher() {
  const { data = {} } = useLocations();
  const { data: locationsRes } = data as { data: { items: Location[] } };
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
  }>();

  const handleLocationSelect = (location: { id: string; name: string }) => {
    setSelectedLocation(location);
    setOpen(false);
  };

  const items = sanitize(locationsRes?.items, "array").map((loc) => ({
    id: loc._id,
    name: loc.name,
  }));

  const activeLocation =
    sanitize(locationsRes?.items, "array").find((loc) => loc.default) ||
    sanitize(locationsRes?.items, "array")[0];

  const defaultLocation = {
    id: activeLocation?._id || "0",
    name: activeLocation?.name || "Default Location",
  };

  return (
    <Popover open={items.length > 1 ? open : false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="group relative h-11 gap-2 px-4 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-300 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900">
                {selectedLocation?.name || defaultLocation.name}
              </span>
            </div>
          </div>
          {items.length > 1 && (
            <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-2 mt-2 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-2xl"
        align="end"
      >
        <div className="px-3 py-2 mb-1">
          <h4 className="text-sm font-semibold text-gray-900">
            Select Location
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose your preferred location
          </p>
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {items.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {location.name}
                  </span>
                </div>
              </div>
              {(selectedLocation?.id || defaultLocation.id) === location.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
