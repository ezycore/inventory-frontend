"use client";
// coding-standard: maintained

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useUpdateStorefrontPage, type StorefrontPage } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";

/** The backend's limits (`updateStorefrontPageSchema`). */
const LIMITS = { title: 160, slug: 80, seoTitle: 70, seoDescription: 200 };

const CHROME_OPTIONS: { value: StorefrontPage["chrome"]; label: string; description: string }[] = [
  { value: "full", label: "Full store header and footer", description: "Menu, search, cart and footer, like the rest of the store." },
  { value: "minimal", label: "Logo only", description: "Just your logo, linking home — fewer ways to wander off." },
  { value: "none", label: "No header or footer", description: "Nothing around your sections." },
];

/** The page's own details — saved on their own, straight away, apart from the sections' draft. */
function SettingsForm({ page, onDone }: { page: StorefrontPage; onDone: () => void }) {
  const update = useUpdateStorefrontPage();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug ?? "");
  const [chrome, setChrome] = useState(page.chrome);
  const [seoTitle, setSeoTitle] = useState(page.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seo.description ?? "");
  const [noindex, setNoindex] = useState(page.seo.noindex);
  const address = slug.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !address || update.isPending) return;
    update.mutate(
      {
        id: page._id,
        body: {
          title: title.trim(),
          // Sent only when it changed: a rename leaves a redirect behind.
          ...(address !== page.slug ? { slug: address } : {}),
          chrome,
          seo: { title: seoTitle.trim(), description: seoDescription.trim(), noindex },
        },
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Page settings</DialogTitle>
        <DialogDescription>These save as soon as you press Save, whether or not the page is published.</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="page-title">Page name</Label>
        <Input id="page-title" value={title} maxLength={LIMITS.title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="page-slug">Address</Label>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm text-muted-foreground">/pages/</span>
          <Input id="page-slug" value={slug} maxLength={LIMITS.slug} onChange={(event) => setSlug(event.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Letters, numbers and dashes.
          {page.published ? " Links to the old address keep working and lead here." : null}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="page-chrome">Header and footer</Label>
        <SimpleSelect
          id="page-chrome"
          value={chrome}
          options={CHROME_OPTIONS}
          onValueChange={(value) => setChrome(value as StorefrontPage["chrome"])}
        />
      </div>

      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold">Search engines</h3>
        <div className="space-y-1.5">
          <Label htmlFor="page-seo-title">Title</Label>
          <Input
            id="page-seo-title"
            value={seoTitle}
            maxLength={LIMITS.seoTitle}
            placeholder={title}
            onChange={(event) => setSeoTitle(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-seo-description">Description</Label>
          <Textarea
            id="page-seo-description"
            value={seoDescription}
            maxLength={LIMITS.seoDescription}
            rows={3}
            onChange={(event) => setSeoDescription(event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="page-noindex">
            Hide from search engines
            <span className="block text-xs font-normal text-muted-foreground">
              On by default: an ad page is usually not worth indexing.
            </span>
          </Label>
          <Switch id="page-noindex" checked={noindex} onCheckedChange={setNoindex} />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || !address || update.isPending}>
          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PageSettingsDialog({
  page,
  open,
  onOpenChange,
}: {
  page: StorefrontPage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Mounted per opening, so the form starts from the page as it is now. */}
        {open ? <SettingsForm page={page} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
