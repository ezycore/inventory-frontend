"use client";
// coding-standard: maintained

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";

/**
 * The Arrange screen's title row and its three actions. Save and Discard act on
 * the working copy; Reset deletes the saved order outright, so it asks first.
 */
export function ArrangeHeader({
  title,
  backHref,
  backLabel,
  storeHref,
  hasCustomOrder,
  dirty,
  readOnly,
  saving,
  onSave,
  onDiscard,
  onReset,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  storeHref?: string;
  hasCustomOrder: boolean;
  dirty: boolean;
  readOnly: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Arrange {title}</h1>
          <Badge variant={hasCustomOrder ? "default" : "secondary"}>
            {hasCustomOrder ? "Custom order" : "Default order"}
          </Badge>
          {dirty ? <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span> : null}
        </div>
        {storeHref ? (
          <a
            href={storeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View in store <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          {hasCustomOrder ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" disabled={saving}>
                  Reset to default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Go back to the default order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your arrangement for {title} is deleted. Shoppers see featured products first, then
                    the newest.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my order</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={onDiscard}>
            Discard
          </Button>
          <Button type="button" disabled={!dirty || saving} onClick={onSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
