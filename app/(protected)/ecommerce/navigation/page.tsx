"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  useContentPages,
  useGetStorefrontSettings,
  useStorefrontCollections,
  useUpdateStorefrontSettings,
} from "@/services/api";
import type {
  StorefrontFooterGroup,
  StorefrontMenuItem,
  StorefrontNav,
  StorefrontSettings,
  NavLinkType,
} from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { SimpleSelect } from "@/ui/components/simple-select";

type Option = { label: string; value: string };

const newItem = (): StorefrontMenuItem => ({
  label: "New link",
  type: "url",
  value: "",
});
const newGroup = (): StorefrontFooterGroup => ({ title: "New group", links: [] });

export default function NavigationPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Header menu, footer links, and the announcement bar.
        </p>
      </div>
      {isLoading || !settings ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <NavigationForm settings={settings} />
      )}
    </div>
  );
}

function NavigationForm({ settings }: { settings: StorefrontSettings }) {
  const save = useUpdateStorefrontSettings();
  const { data: collections } = useStorefrontCollections();
  const { data: pages } = useContentPages();

  // Menu links target categories by slug; slugless ones (legacy seed data) are
  // unlinkable — and Radix Select crashes on empty-string item values.
  const categoryOptions: Option[] = (collections ?? []).flatMap((c) =>
    c.slug ? [{ label: c.storefront?.displayName || c.name, value: c.slug }] : [],
  );
  const pageOptions: Option[] = (pages ?? []).map((p) => ({
    label: p.title,
    value: p.slug,
  }));

  const nav = settings.nav;
  const [header, setHeader] = useState<StorefrontMenuItem[]>(nav?.header ?? []);
  const [footer, setFooter] = useState<StorefrontFooterGroup[]>(
    nav?.footer ?? [],
  );
  const [annEnabled, setAnnEnabled] = useState(nav?.announcement?.enabled ?? false);
  const [annText, setAnnText] = useState(nav?.announcement?.text ?? "");
  const [annLink, setAnnLink] = useState(nav?.announcement?.link ?? "");
  const [annColor, setAnnColor] = useState(
    nav?.announcement?.bgColor ?? "#2563eb",
  );

  // ---- header mutations ----
  const patchItem = (i: number, patch: Partial<StorefrontMenuItem>) =>
    setHeader((h) => h.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) =>
    setHeader((h) => h.filter((_, idx) => idx !== i));
  const moveItem = (i: number, dir: -1 | 1) =>
    setHeader((h) => {
      const next = [...h];
      const t = i + dir;
      if (t < 0 || t >= next.length) return h;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  const addChild = (i: number) =>
    setHeader((h) =>
      h.map((it, idx) =>
        idx === i
          ? { ...it, children: [...(it.children ?? []), newItem()] }
          : it,
      ),
    );
  const patchChild = (
    i: number,
    ci: number,
    patch: Partial<StorefrontMenuItem>,
  ) =>
    setHeader((h) =>
      h.map((it, idx) =>
        idx === i
          ? {
              ...it,
              children: (it.children ?? []).map((c, cidx) =>
                cidx === ci ? { ...c, ...patch } : c,
              ),
            }
          : it,
      ),
    );
  const removeChild = (i: number, ci: number) =>
    setHeader((h) =>
      h.map((it, idx) =>
        idx === i
          ? { ...it, children: (it.children ?? []).filter((_, x) => x !== ci) }
          : it,
      ),
    );

  // ---- footer mutations ----
  const patchGroup = (i: number, patch: Partial<StorefrontFooterGroup>) =>
    setFooter((f) => f.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const removeGroup = (i: number) =>
    setFooter((f) => f.filter((_, idx) => idx !== i));
  const addLink = (i: number) =>
    setFooter((f) =>
      f.map((g, idx) =>
        idx === i ? { ...g, links: [...g.links, { label: "", url: "" }] } : g,
      ),
    );
  const patchLink = (
    i: number,
    li: number,
    patch: Partial<{ label: string; url: string }>,
  ) =>
    setFooter((f) =>
      f.map((g, idx) =>
        idx === i
          ? {
              ...g,
              links: g.links.map((l, lidx) =>
                lidx === li ? { ...l, ...patch } : l,
              ),
            }
          : g,
      ),
    );
  const removeLink = (i: number, li: number) =>
    setFooter((f) =>
      f.map((g, idx) =>
        idx === i ? { ...g, links: g.links.filter((_, x) => x !== li) } : g,
      ),
    );

  const submit = () => {
    const clean = (items: StorefrontMenuItem[]): StorefrontMenuItem[] =>
      items
        .filter((it) => it.label.trim())
        .map((it) => ({
          label: it.label.trim(),
          type: it.type,
          value: it.value.trim(),
          children: it.children?.length
            ? it.children
                .filter((c) => c.label.trim())
                .map((c) => ({
                  label: c.label.trim(),
                  type: c.type,
                  value: c.value.trim(),
                }))
            : undefined,
        }));
    const nextNav: StorefrontNav = {
      header: clean(header),
      footer: footer
        .filter((g) => g.title.trim())
        .map((g) => ({
          title: g.title.trim(),
          links: g.links.filter((l) => l.label.trim()),
        })),
      announcement: {
        enabled: annEnabled,
        text: annText.trim() || undefined,
        link: annLink.trim() || undefined,
        bgColor: annColor,
      },
    };
    save.mutate({ nav: nextNav });
  };

  return (
    <div className="space-y-5">
      {/* Announcement bar */}
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Announcement bar</h3>
            <p className="text-xs text-muted-foreground">
              A single line shown at the top of every storefront page.
            </p>
          </div>
          <Switch checked={annEnabled} onCheckedChange={setAnnEnabled} />
        </div>
        {annEnabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Text</Label>
              <Input
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                maxLength={200}
                placeholder="Free delivery on orders over ৳2000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link (optional)</Label>
              <Input
                value={annLink}
                onChange={(e) => setAnnLink(e.target.value)}
                placeholder="/products"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Background color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={annColor}
                  onChange={(e) => setAnnColor(e.target.value)}
                  className="h-9 w-12 flex-none rounded border"
                  aria-label="Announcement background color"
                />
                <Input
                  value={annColor}
                  onChange={(e) => setAnnColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Header menu */}
      <Card className="space-y-3 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Header menu</h3>
            <p className="text-xs text-muted-foreground">
              Top navigation links. Add sub-items for one level of dropdowns.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHeader((h) => [...h, newItem()])}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
        </div>
        {header.length === 0 ? (
          <p className="text-sm text-muted-foreground">No menu items yet.</p>
        ) : (
          <div className="space-y-3">
            {header.map((item, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-none flex-col pt-1.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => moveItem(i, -1)}
                      className="text-muted-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={i === header.length - 1}
                      onClick={() => moveItem(i, 1)}
                      className="text-muted-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <LinkFields
                    item={item}
                    categoryOptions={categoryOptions}
                    pageOptions={pageOptions}
                    onChange={(patch) => patchItem(i, patch)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* children */}
                {(item.children ?? []).length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 pl-4">
                    {(item.children ?? []).map((child, ci) => (
                      <div key={ci} className="flex items-start gap-2">
                        <LinkFields
                          item={child}
                          categoryOptions={categoryOptions}
                          pageOptions={pageOptions}
                          onChange={(patch) => patchChild(i, ci, patch)}
                        />
                        <button
                          type="button"
                          onClick={() => removeChild(i, ci)}
                          className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
                          aria-label="Remove sub-item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => addChild(i)}
                  className="mt-2 text-xs font-semibold text-primary"
                >
                  + Add sub-item
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Footer */}
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
            onClick={() => setFooter((f) => [...f, newGroup()])}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add group
          </Button>
        </div>
        {footer.length === 0 ? (
          <p className="text-sm text-muted-foreground">No footer groups yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {footer.map((group, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={group.title}
                    onChange={(e) => patchGroup(i, { title: e.target.value })}
                    placeholder="Group title"
                    className="h-8 font-medium"
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
                      onChange={(e) =>
                        patchLink(i, li, { label: e.target.value })
                      }
                      placeholder="Label"
                      className="h-8"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => patchLink(i, li, { url: e.target.value })}
                      placeholder="/path or URL"
                      className="h-8"
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

      <div className="flex justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save navigation"}
        </Button>
      </div>
    </div>
  );
}

function LinkFields({
  item,
  categoryOptions,
  pageOptions,
  onChange,
}: {
  item: StorefrontMenuItem;
  categoryOptions: Option[];
  pageOptions: Option[];
  onChange: (patch: Partial<StorefrontMenuItem>) => void;
}) {
  return (
    <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_120px_1fr]">
      <Input
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label"
        className="h-8"
      />
      <SimpleSelect
        value={item.type}
        onValueChange={(v) => onChange({ type: v as NavLinkType, value: "" })}
        options={[
          { label: "Category", value: "category" },
          { label: "Page", value: "page" },
          { label: "URL", value: "url" },
        ]}
        className="h-8"
      />
      {item.type === "url" ? (
        <Input
          value={item.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="/path or https://…"
          className="h-8"
        />
      ) : (
        <SimpleSelect
          value={item.value}
          onValueChange={(v) => onChange({ value: v })}
          options={item.type === "category" ? categoryOptions : pageOptions}
          placeholder={`Select ${item.type}`}
          className="h-8"
        />
      )}
    </div>
  );
}
