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
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { scheduleBodyOf, scheduleDraftOf, scheduleProblem } from "../page-schedule";
import { PageScheduleFields } from "./page-schedule-fields";

/** The backend's limits (`updateStorefrontPageSchema`). */
const LIMITS = { title: 160, slug: 80, seoTitle: 70, seoDescription: 200, footerOrder: 999 };

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
  // Store pages only: nothing else has a place in the footer column, and the
  // backend refuses the field on any other kind.
  const inFooter = page.kind === "content";
  const [footerShow, setFooterShow] = useState(page.footer?.show !== false);
  const [footerOrder, setFooterOrder] = useState<number | null>(page.footer?.order ?? 0);
  const [seoTitle, setSeoTitle] = useState(page.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seo.description ?? "");
  const [noindex, setNoindex] = useState(page.seo.noindex);
  // Offers are landing pages; the backend refuses a schedule on any other kind.
  const schedulable = page.kind === "landing";
  const [schedule, setSchedule] = useState(() => scheduleDraftOf(page.schedule));
  const scheduleBody = scheduleBodyOf(schedule);
  const problem = schedulable ? scheduleProblem(schedule) : null;
  // Sent only when it changed, like the address: re-saving the page's name must
  // not re-check a schedule whose chosen page has since been deleted.
  const scheduleChanged =
    schedulable &&
    JSON.stringify(scheduleBody) !== JSON.stringify(scheduleBodyOf(scheduleDraftOf(page.schedule)));
  const address = slug.trim();
  // A system page (the home page) has a fixed address; the backend refuses a slug for one.
  const fixedAddress = page.kind === "system";
  const ready = !!title.trim() && (fixedAddress || !!address) && !problem;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready || update.isPending) return;
    update.mutate(
      {
        id: page._id,
        body: {
          title: title.trim(),
          // Sent only when it changed: a rename leaves a redirect behind.
          ...(!fixedAddress && address !== page.slug ? { slug: address } : {}),
          chrome,
          ...(inFooter ? { footer: { show: footerShow, order: footerOrder ?? 0 } } : {}),
          seo: { title: seoTitle.trim(), description: seoDescription.trim(), noindex },
          ...(scheduleChanged ? { schedule: scheduleBody } : {}),
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

      {fixedAddress ? null : (
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
      )}

      <div className="space-y-1.5">
        <Label htmlFor="page-chrome">Header and footer</Label>
        <SimpleSelect
          id="page-chrome"
          value={chrome}
          options={CHROME_OPTIONS}
          onValueChange={(value) => setChrome(value as StorefrontPage["chrome"])}
        />
      </div>

      {schedulable ? (
        <PageScheduleFields pageId={page._id} value={schedule} onChange={setSchedule} problem={problem} />
      ) : null}

      {inFooter ? (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold">In your footer</h3>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="page-footer-show">
              List this page in the footer
              <span className="block text-xs font-normal text-muted-foreground">
                Shoppers reach your policies from every page. Off keeps the page and its address —
                only the link goes.
              </span>
            </Label>
            <Switch id="page-footer-show" checked={footerShow} onCheckedChange={setFooterShow} />
          </div>
          {footerShow ? (
            <div className="space-y-1.5">
              <Label htmlFor="page-footer-order">Position</Label>
              <NumberField
                id="page-footer-order"
                min={0}
                max={LIMITS.footerOrder}
                precision={0}
                value={footerOrder}
                onChange={setFooterOrder}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers come first. Pages sharing a number are listed by name.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

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
            {/* The default is per kind, and they are opposites — a store page
                exists to be found, an ad's landing page is usually one of three
                near-duplicates. Saying "on by default" on both was wrong on the
                one whose switch is off in front of the merchant reading it. */}
            <span className="block text-xs font-normal text-muted-foreground">
              {inFooter
                ? "Off by default: a page like About or a policy is worth finding."
                : "On by default: an ad page is usually not worth indexing."}
            </span>
          </Label>
          <Switch id="page-noindex" checked={noindex} onCheckedChange={setNoindex} />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!ready || update.isPending}>
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
