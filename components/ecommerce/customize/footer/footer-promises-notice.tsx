"use client";
// coding-standard: maintained

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import type { StorefrontTrustBadge } from "@/types";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { TrustBadgesField } from "@/components/ecommerce/customize/trust-badges-field";

/**
 * Shown in the block list while the footer has no Store promises block.
 *
 * The promises are edited inside that block, so without this a merchant could
 * write promises that nothing in the footer draws — and nothing said so. It
 * also keeps them editable without the block, because promise sections on
 * pages and the hero read the same list and a shop may want them there only.
 */
export function FooterPromisesNotice({
  badges,
  setBadges,
  onAdd,
}: {
  badges: StorefrontTrustBadge[];
  setBadges: (badges: StorefrontTrustBadge[]) => void;
  /** Adds a Store promises block and opens it. */
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const written = badges.filter((badge) => badge.text?.trim()).length;

  return (
    <div className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
        <p className="text-sm leading-snug">
          {written ? (
            <>
              <span className="font-medium">
                You have {written} store promise{written === 1 ? "" : "s"}
              </span>{" "}
              but your footer doesn’t show them.
            </>
          ) : (
            "Store promises can show in your footer and in promise sections on your pages."
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Add to footer
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((open) => !open)} aria-expanded={editing}>
          {editing ? "Done" : "Edit promises"}
        </Button>
      </div>
      {editing ? (
        <div className="space-y-2">
          <TrustBadgesField badges={badges} setBadges={setBadges} />
          <PartHint>These also show in promise sections on your pages.</PartHint>
        </div>
      ) : null}
    </div>
  );
}
