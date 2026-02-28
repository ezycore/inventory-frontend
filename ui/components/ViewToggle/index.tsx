"use client";

import { cn } from "@/ui/lib/utils";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

type ViewMode = "table" | "card";

interface ViewToggleProps {
  /** Unique key for persisting the preference in localStorage */
  storageKey: string;
  defaultView?: ViewMode;
  onChange?: (view: ViewMode) => void;
  className?: string;
}

const ViewToggle = ({
  storageKey,
  defaultView = "table",
  onChange,
  className,
}: ViewToggleProps) => {
  const [view, setView] = useState<ViewMode>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(`view-toggle-${storageKey}`);
    if (stored === "table" || stored === "card") {
      setView(stored);
    }
  }, [storageKey]);

  const handleChange = useCallback(
    (newView: ViewMode) => {
      setView(newView);
      localStorage.setItem(`view-toggle-${storageKey}`, newView);
      onChange?.(newView);
    },
    [storageKey, onChange],
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => handleChange("table")}
            className={cn(
              "h-7 w-7",
              view === "table"
                ? "bg-background shadow-sm"
                : "hover:bg-transparent",
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Table view</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => handleChange("card")}
            className={cn(
              "h-7 w-7",
              view === "card"
                ? "bg-background shadow-sm"
                : "hover:bg-transparent",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Card view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default ViewToggle;
export type { ViewMode, ViewToggleProps };
