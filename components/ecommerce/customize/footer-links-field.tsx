"use client";
// coding-standard: maintained

import { Plus, Trash2 } from "lucide-react";
import type { StorefrontFooterGroup } from "@/types";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { PartHint, PartLabel } from "@/components/ecommerce/customize/part-group";
import type { FooterContentPagesDraft } from "@/components/ecommerce/customize/use-customize-draft";

export const newFooterGroup = (): StorefrontFooterGroup => ({
  title: "New group",
  links: [],
});

/**
 * The grouped links in the storefront footer, plus the auto "Information"
 * column built from published pages flagged "Show in footer" (Ecommerce →
 * Content). Each group is one column on the Columns and Rich layouts, and a
 * flat row on Simple.
 */
export function FooterLinksField({
  groups,
  setGroups,
  contentPages,
  setContentPages,
}: {
  groups: StorefrontFooterGroup[];
  setGroups: (v: StorefrontFooterGroup[]) => void;
  contentPages: FooterContentPagesDraft;
  setContentPages: (patch: Partial<FooterContentPagesDraft>) => void;
}) {
  const patchGroup = (i: number, patch: Partial<StorefrontFooterGroup>) =>
    setGroups(groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const removeGroup = (i: number) => setGroups(groups.filter((_, idx) => idx !== i));
  const addLink = (i: number) =>
    setGroups(
      groups.map((g, idx) =>
        idx === i ? { ...g, links: [...g.links, { label: "", url: "" }] } : g,
      ),
    );
  const patchLink = (
    i: number,
    li: number,
    patch: Partial<{ label: string; url: string }>,
  ) =>
    setGroups(
      groups.map((g, idx) =>
        idx === i
          ? { ...g, links: g.links.map((l, lidx) => (lidx === li ? { ...l, ...patch } : l)) }
          : g,
      ),
    );
  const removeLink = (i: number, li: number) =>
    setGroups(
      groups.map((g, idx) =>
        idx === i ? { ...g, links: g.links.filter((_, x) => x !== li) } : g,
      ),
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <PartLabel>Link groups</PartLabel>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setGroups([...groups, newFooterGroup()])}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add group
        </Button>
      </div>

      {groups.length === 0 ? (
        <PartHint>
          No link groups yet — your footer shows the © line only.
        </PartHint>
      ) : (
        // One group per row: the rail is 380px, where two groups across squeezed
        // every label/url field to ~53px.
        <div className="grid gap-3">
          {groups.map((group, i) => (
            <div key={i} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={group.title}
                  onChange={(e) => patchGroup(i, { title: e.target.value })}
                  placeholder="Group title"
                  className="h-9 font-medium"
                  aria-label="Group title"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(i)}
                  className="flex-none text-muted-foreground hover:text-red-600"
                  aria-label={`Remove ${group.title || "group"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {group.links.map((link, li) => (
                <div key={li} className="flex items-center gap-1.5">
                  <Input
                    value={link.label}
                    onChange={(e) => patchLink(i, li, { label: e.target.value })}
                    placeholder="Label"
                    className="h-9"
                    aria-label="Link label"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => patchLink(i, li, { url: e.target.value })}
                    placeholder="/path or URL"
                    className="h-9"
                    aria-label="Link URL"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i, li)}
                    className="flex-none text-muted-foreground hover:text-red-600"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addLink(i)}
                className="text-xs font-semibold text-primary"
              >
                + Add link
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5 rounded-lg border bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Content pages column</p>
            <PartHint>
              Your published pages, listed automatically.
            </PartHint>
          </div>
          <Switch
            checked={contentPages.show}
            onCheckedChange={(show) => setContentPages({ show })}
            aria-label="Show the content pages footer column"
          />
        </div>
        {contentPages.show ? (
          <div className="space-y-1.5">
            <Label htmlFor="footer-info-title" className="text-xs">
              Column heading
            </Label>
            <Input
              id="footer-info-title"
              value={contentPages.title}
              onChange={(e) => setContentPages({ title: e.target.value })}
              placeholder="Information"
              maxLength={60}
              className="h-9"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
