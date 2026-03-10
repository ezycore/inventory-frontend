"use client";

import { useRef, useState } from "react";
import { Badge } from "@/ui/components/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";

// Color palette for colorized (card) variant
const badgeColors = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
];

interface ValuesPopoverProps {
  /** All values to display */
  values: string[];
  /** How many values to show before collapsing into "+X more". Default: 3 */
  maxVisible?: number;
  /** Use colourised pill badges (card style). Default: false (outline badges) */
  colorized?: boolean;
}

export function ValuesPopover({
  values = [],
  maxVisible = 3,
  colorized = false,
}: ValuesPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = values.slice(0, maxVisible);
  const hidden = values.slice(maxVisible);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const renderBadge = (value: string, index: number) => {
    if (colorized) {
      return (
        <span
          key={index}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColors[index % badgeColors.length]}`}
        >
          {value}
        </span>
      );
    }
    return (
      <Badge key={index} variant="outline" className="text-xs">
        {value}
      </Badge>
    );
  };

  const renderHiddenBadge = (value: string, index: number) => {
    const colorIndex = (maxVisible + index) % badgeColors.length;
    if (colorized) {
      return (
        <span
          key={index}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColors[colorIndex]}`}
        >
          {value}
        </span>
      );
    }
    return (
      <Badge key={index} variant="outline" className="text-xs">
        {value}
      </Badge>
    );
  };

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((value, index) => renderBadge(value, index))}

      {hidden.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/70 transition-colors select-none"
              onMouseEnter={() => {
                cancelClose();
                setOpen(true);
              }}
              onMouseLeave={scheduleClose}
            >
              +{hidden.length} more
            </Badge>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[260px] p-3"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            // prevent the click-outside from closing when hovering
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {hidden.length} more value{hidden.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hidden.map((value, index) => renderHiddenBadge(value, index))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
