"use client";

import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { MapPin } from "lucide-react";

interface Location {
  _id: string;
  name?: string;
  [key: string]: any;
}

interface LocationCountCellProps {
  locations?: Location[];
  role?: string;
  hasAllLocationAccess?: boolean;
}

export function LocationCountCell({
  locations = [],
  role,
  hasAllLocationAccess = false,
}: LocationCountCellProps) {
  if (hasAllLocationAccess || role === "admin" || role === "super_admin") {
    return <Badge variant="default">All Locations</Badge>;
  }

  const locationCount = locations?.length || 0;

  if (!locationCount) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="font-medium">{locationCount}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Locations</h4>
            <Badge variant="secondary">{locationCount} total</Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {locations.map((loc) => (
              <div
                key={loc._id}
                className="flex items-start justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{loc.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LocationCountCell;
