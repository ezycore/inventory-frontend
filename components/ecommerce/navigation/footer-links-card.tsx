"use client";
// coding-standard: maintained

import { Plus, Trash2 } from "lucide-react";
import type { StorefrontFooterGroup } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";

export const newFooterGroup = (): StorefrontFooterGroup => ({
  title: "New group",
  links: [],
});

/** Customize → Navigation → the grouped links in the storefront footer. */
export function FooterLinksCard({
  groups,
  setGroups,
}: {
  groups: StorefrontFooterGroup[];
  setGroups: (v: StorefrontFooterGroup[]) => void;
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
            Grouped links shown in the storefront footer.
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
    </Card>
  );
}
