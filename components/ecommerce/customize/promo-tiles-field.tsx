"use client";
// coding-standard: maintained

import type { StorefrontPromoTile } from "@/types";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

/**
 * The two promo tiles that close the hero-split home page.
 *
 * Every field is optional and falls back **per slot** to the storefront's
 * built-in copy, so a half-filled tile still renders — a merchant who only has
 * one campaign running does not have to invent a second one. Until this
 * existed the tiles advertised "Eid Sale" and "Tools Clearance" in every shop
 * that rendered them, which is someone else's promotion on your homepage.
 */
export function PromoTilesField({
  tiles,
  setTile,
}: {
  tiles: StorefrontPromoTile[];
  setTile: (i: number, patch: Partial<StorefrontPromoTile>) => void;
}) {
  return (
    <div className="space-y-3">
      {tiles.map((tile, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border bg-background p-2.5">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {i === 0 ? "Filled tile" : "Outlined tile"}
          </Label>
          <Input
            value={tile.label ?? ""}
            onChange={(e) => setTile(i, { label: e.target.value })}
            placeholder={i === 0 ? "Eid Sale" : "Clearance"}
            maxLength={30}
            className="h-8 text-[13px]"
          />
          <Input
            value={tile.title ?? ""}
            onChange={(e) => setTile(i, { title: e.target.value })}
            placeholder={
              i === 0 ? "Up to 40% off this week" : "Last pieces, reduced"
            }
            maxLength={80}
            className="h-9"
          />
          <Input
            value={tile.link ?? ""}
            onChange={(e) => setTile(i, { link: e.target.value })}
            placeholder="/products?categoryId=… (blank = all products)"
            maxLength={300}
            className="h-8 text-[13px]"
          />
        </div>
      ))}
    </div>
  );
}
