"use client";

/**
 * Phase 3.6c — Top-bar workspace switcher.
 *
 * Lists the workspaces the active YoCore session can switch into and lets
 * the user switch mid-session. On switch the auth-store user/token is
 * replaced and every TanStack Query is invalidated (workspace-scoped data
 * on the BE).
 *
 * Hides itself when the user only belongs to a single workspace — there's
 * nothing to switch to.
 */

import { useMyWorkspaces, useSwitchWorkspace } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { cn } from "@/ui/lib/utils";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

export function WorkspaceSwitcher() {
  const { user } = useAuthStore();
  const { data: workspaces, isLoading } = useMyWorkspaces();
  const switchMutation = useSwitchWorkspace();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden md:inline">Loading…</span>
      </Button>
    );
  }

  if (!workspaces || workspaces.length <= 1) {
    return null;
  }

  const activeSlug = user?.organization?.slug;
  const active =
    workspaces.find((w) => w.slug === activeSlug) || workspaces[0];

  const handleSelect = (workspaceId: string) => {
    if (active && workspaceId === active.id) {
      setOpen(false);
      return;
    }
    switchMutation.mutate(workspaceId, {
      onSettled: () => setOpen(false),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Switch workspace"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden max-w-[160px] truncate md:inline">
            {active?.name ?? "Workspace"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Switch workspace
        </div>
        <ul className="flex flex-col">
          {workspaces.map((w) => {
            const isActive = active?.id === w.id;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(w.id)}
                  disabled={switchMutation.isPending}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
                    isActive && "bg-accent/60",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{w.name}</div>
                    {w.role && (
                      <div className="truncate text-xs text-muted-foreground">
                        {w.role}
                      </div>
                    )}
                  </div>
                  {switchMutation.isPending &&
                  switchMutation.variables === w.id ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : isActive ? (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
