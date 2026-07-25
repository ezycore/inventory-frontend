"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import { Badge } from "@/ui/components/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { useSingleLineFit } from "@/hooks/use-single-line-fit";

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
  /**
   * Keep every badge on one row, measuring how many actually fit instead of
   * trusting `maxVisible` (which then acts as an upper cap only). Default: false.
   */
  singleLine?: boolean;
}

export function ValuesPopover({
  values = [],
  maxVisible = 3,
  colorized = false,
  singleLine = false,
}: ValuesPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { containerRef, measureRef, visibleCount } = useSingleLineFit(
    values.length,
    singleLine,
  );

  const shown = singleLine ? Math.min(visibleCount, maxVisible) : maxVisible;
  const visible = values.slice(0, shown);
  const hidden = values.slice(shown);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const renderBadge = (value: string, colorIndex: number) => {
    if (colorized) {
      return (
        <span
          key={`${value}-${colorIndex}`}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${badgeColors[colorIndex % badgeColors.length]}`}
        >
          {value}
        </span>
      );
    }
    return (
      <Badge
        key={`${value}-${colorIndex}`}
        variant="outline"
        className="text-xs whitespace-nowrap"
      >
        {value}
      </Badge>
    );
  };

  const renderMoreChip = (count: number, interactive: boolean) => (
    <Badge
      variant="secondary"
      className="text-xs cursor-pointer hover:bg-secondary/70 transition-colors select-none whitespace-nowrap"
      onMouseEnter={
        interactive
          ? () => {
              cancelClose();
              setOpen(true);
            }
          : undefined
      }
      onMouseLeave={interactive ? scheduleClose : undefined}
    >
      +{count} more
    </Badge>
  );

  return (
    <div
      ref={containerRef}
      className={
        singleLine
          ? "relative flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden [&>*]:shrink-0"
          : "flex flex-wrap gap-1"
      }
    >
      {singleLine && (
        // Off-screen width probe: all values plus the widest possible chip.
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 -z-10 flex w-max flex-nowrap items-center gap-1 opacity-0"
        >
          {values.map((value, index) => renderBadge(value, index))}
          {renderMoreChip(values.length, false)}
        </div>
      )}

      {visible.map((value, index) => renderBadge(value, index))}

      {hidden.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{renderMoreChip(hidden.length, true)}</PopoverTrigger>
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
              {hidden.map((value, index) => renderBadge(value, shown + index))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
