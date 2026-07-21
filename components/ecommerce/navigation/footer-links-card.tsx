"use client";
// coding-standard: maintained

import { Plus, Trash2 } from "lucide-react";
import type { StorefrontFooterGroup } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";

export const newFooterGroup = (): StorefrontFooterGroup => ({
  title: "New group",
  links: [],
});

/** Draft shape for the auto content-pages footer column (show + heading). */
export interface FooterContentPagesDraft {
  show: boolean;
  title: string;
}

/** Customize → Navigation → the grouped links in the storefront footer. */
export function FooterLinksCard({
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
          ? {
              ...g,
              links: g.links.map((l, lidx) => (lidx === li ? { ...l, ...patch } : l)),
            }
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
    <Card className="space-y-3 p-5 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Footer</h3>
          <p className="text-xs text-muted-foreground">
            Each group is its own column in the footer (a flat row on the Simple
            layout).
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setGroups([...groups, newFooterGroup()])}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add group
        </Button>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No footer groups yet.</p>
      ) : (
        // One group per row: this card moved from a full-width page into the
        // 380px Customize rail, where two groups across squeezed each
        // label/url field to ~53px.
        <div className="grid gap-3">
          {groups.map((group, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={group.title}
                  onChange={(e) => patchGroup(i, { title: e.target.value })}
                  placeholder="Group title"
                  className="h-8 font-medium"
                  aria-label="Group title"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(i)}
                  className="flex-none text-muted-foreground hover:text-red-600"
                  aria-label="Remove group"
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
                    className="h-8"
                    aria-label="Link label"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => patchLink(i, li, { url: e.target.value })}
                    placeholder="/path or URL"
                    className="h-8"
                    aria-label="Link URL"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i, li)}
                    className="flex-none text-muted-foreground hover:text-red-600"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

      {/* The auto "Information" column, built from published pages flagged
          "Show in footer" (Ecommerce → Content). Merchants can hide it or
          rename its heading. */}
      <div className="space-y-2.5 rounded-lg border p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Content pages column</p>
            <p className="text-xs text-muted-foreground">
              Show/Hide in the footer
            </p>
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
              className="h-8"
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
