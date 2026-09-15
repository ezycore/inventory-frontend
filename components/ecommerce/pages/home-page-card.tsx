"use client";
// coding-standard: maintained

import Link from "next/link";
import { House, PencilRuler } from "lucide-react";
import { useStorefrontPages } from "@/services/api";
import { Button } from "@/ui/components/button";

/**
 * The store's home page, when it is a builder page — moved there from the
 * Customize home (backend `storefrontMigrationService.moveHome`). It is not a
 * landing page, so it sits above their table rather than in it: it cannot be
 * duplicated, turned off or deleted, only edited.
 */
export function HomePageCard() {
  const { data } = useStorefrontPages({ kind: "system", limit: 10 });
  const home = data?.items.find((page) => page.systemKey === "home");
  if (!home) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
      <House className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Home page</p>
        <p className="text-xs text-muted-foreground">
          What shoppers see at your store&apos;s address, built from sections.
          {home.hasDraft ? " It has unpublished changes." : null}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={`/ecommerce/pages/${home._id}`}>
          <PencilRuler className="mr-1.5 h-4 w-4" />
          Open editor
        </Link>
      </Button>
    </div>
  );
}
