"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible";

export type ToolStatus = { label: string; tone: "on" | "partial" | "off" };

/**
 * One measurement tool on the Marketing tab (backend `docs/plan/storefront-ga4.md` §6):
 * collapsed by default, the whole header is the tap target, and its status is readable without
 * opening it.
 *
 * **The body stays mounted while collapsed** (`forceMount` + hidden). Radix unmounts closed
 * content by default, which would throw away whatever the merchant typed the moment they
 * collapsed the row to look at another tool. `renderBody` receives `onDirtyChange` so the form can
 * light the "Unsaved" dot on the collapsed header.
 */
export function MarketingToolRow({
  title,
  subtitle,
  status,
  renderBody,
}: {
  title: string;
  subtitle: string;
  status?: ToolStatus;
  renderBody: (onDirtyChange: (dirty: boolean) => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CollapsibleTrigger className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-start hover:bg-muted/40">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>
          {dirty && !open ? (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
              Unsaved
            </span>
          ) : null}
          {status ? (
            <Badge
              variant={status.tone === "on" ? "default" : status.tone === "partial" ? "secondary" : "outline"}
              className="whitespace-nowrap"
            >
              {status.label}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent forceMount className="border-t p-4 data-[state=closed]:hidden">
          {renderBody(setDirty)}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
