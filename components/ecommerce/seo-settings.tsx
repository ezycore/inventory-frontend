"use client";
// coding-standard: maintained
import { useRef, useState } from "react";
import { useDomains } from "@/services/api/modules/domains/hooks";
import {
  useUpdateStorefrontMedia,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { cn } from "@/ui/lib/utils";

/**
 * Search-engine settings for the store **home page** — the one page a merchant
 * had no say over until now.
 *
 * `StorefrontSettings.seo` has existed end-to-end since the storefront shipped:
 * model, validator, public payload, and `shop/page.tsx`'s `generateMetadata` all
 * read it. Nothing ever wrote it, so every store in production titled as its bare
 * name and described itself with a hard-coded sentence. This form is the missing
 * half; the backend needed no change at all.
 *
 * The preview is the point of the screen. A merchant will not fill in a field
 * labelled "meta description"; they will fill in a box when they can see the
 * Google result it produces — including the one they have *right now*, which is
 * what the fallbacks below render when both fields are empty.
 *
 * ⚠️ Those fallbacks are a cross-file contract with
 * `app/(storefront)/shop/page.tsx`. If the storefront's defaults change, change
 * them here in the same commit or the preview starts lying.
 */

/** Model limits (`storefront-settings.model.ts` `seo`). Hard stops. */
const MAX_TITLE = 160;
const MAX_DESCRIPTION = 320;

/**
 * Where Google typically truncates in a desktop result. Not limits — plenty of
 * good titles run longer and simply get an ellipsis — so these only tint the
 * counter, they never block a save.
 */
const VISIBLE_TITLE = 60;
const VISIBLE_DESCRIPTION = 155;

/** Mirrors `shop/page.tsx`: `store.seo?.description || …`. */
const fallbackDescription = (storeName: string) =>
  `Shop ${storeName} online — order with delivery.`;

function Counter({ value, visible, max }: { value: string; visible: number; max: number }) {
  const n = value.length;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        n > max
          ? "text-destructive"
          : n > visible
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground",
      )}
    >
      {n}/{visible}
      {n > visible && n <= max ? " · may be cut off" : null}
    </span>
  );
}

/** A single Google-style result row. */
function SerpPreview({
  host,
  title,
  description,
}: {
  host: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-xl space-y-0.5 rounded-md border bg-background p-4">
      <p className="truncate text-xs text-muted-foreground">{host}</p>
      <p className="truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
        {title}
      </p>
      <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * The image a shared link renders with — Facebook, WhatsApp, Messenger. In this
 * market that is the primary discovery channel, so a link that previews as a
 * grey box costs traffic that has nothing to do with ranking.
 *
 * Its own upload rather than a reuse of the banner because the shapes fight: a
 * share card is 1200×630, a storefront banner is far wider, and the crop lands
 * somewhere unhelpful. Unset falls back banner → logo, resolved server-side.
 */
function ShareImageCard({ settings }: { settings: StorefrontSettings }) {
  const media = useUpdateStorefrontMedia();
  const fileInput = useRef<HTMLInputElement>(null);
  const current = settings.socialImage?.mediumUrl || settings.socialImage?.url;

  const send = (build: (fd: FormData) => void) => {
    const fd = new FormData();
    build(fd);
    media.mutate(fd);
  };

  return (
    <Card className="space-y-3 p-5 shadow-none">
      <div>
        <h3 className="text-sm font-semibold">Share image</h3>
        <p className="text-xs text-muted-foreground">
          Shown when someone shares a link to your store on Facebook, WhatsApp or
          Messenger. 1200 × 630 works best. Without one, your banner is used, then
          your logo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-[84px] w-40 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt="Share image"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={media.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {current ? "Replace" : "Upload"}
          </Button>
          {current && (
            <Button
              variant="ghost"
              size="sm"
              disabled={media.isPending}
              onClick={() => send((fd) => fd.append("removeSocialImage", "true"))}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) send((fd) => fd.append("socialImage", file));
            // Reset so re-picking the same file fires `change` again.
            e.target.value = "";
          }}
        />
      </div>
    </Card>
  );
}

export function SeoSettings({ settings }: { settings: StorefrontSettings }) {
  const update = useUpdateStorefrontSettings();
  const [title, setTitle] = useState(settings.seo?.title ?? "");
  const [description, setDescription] = useState(
    settings.seo?.description ?? "",
  );

  const org = useAuthStore((s) => s.user?.organization);
  const storeName = settings.displayName || org?.name || "Your store";

  // Show the host the store is actually indexed under. Since the canonical-host
  // 301 shipped, a store with an active custom domain no longer serves its
  // subdomain at all — previewing `slug.ezycore.com` for those merchants would
  // show a URL that redirects away.
  const { data: domains } = useDomains();
  const customDomain = (domains ?? []).find(
    (d) => d.type === "custom" && d.status === "active",
  )?.domain;
  const host =
    customDomain ??
    (org?.slug
      ? storefrontUrl(org.slug).replace(/^https?:\/\//, "")
      : "your-store");

  const effectiveTitle = title.trim() || storeName;
  const effectiveDescription =
    description.trim() || fallbackDescription(storeName);

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Search engine listing</h3>
          <p className="text-xs text-muted-foreground">
            How your store&apos;s home page appears in Google. Leave a field empty
            to use the default shown in the preview.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label>Page title</Label>
            <Counter value={title} visible={VISIBLE_TITLE} max={MAX_TITLE} />
          </div>
          <Input
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={storeName}
          />
          <p className="text-xs text-muted-foreground">
            Put what you sell in it, not just your name — &ldquo;{storeName} —
            Home &amp; kitchen delivery in Dhaka&rdquo; beats &ldquo;{storeName}
            &rdquo;.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label>Meta description</Label>
            <Counter
              value={description}
              visible={VISIBLE_DESCRIPTION}
              max={MAX_DESCRIPTION}
            />
          </div>
          <Textarea
            value={description}
            maxLength={MAX_DESCRIPTION}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={fallbackDescription(storeName)}
          />
          <p className="text-xs text-muted-foreground">
            One or two sentences. It rarely changes your ranking, but it is the
            text a shopper reads before deciding to click.
          </p>
        </div>
      </Card>

      <ShareImageCard settings={settings} />

      <Card className="space-y-3 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Preview</h3>
          <p className="text-xs text-muted-foreground">
            Roughly how the result looks. Google rewrites titles and descriptions
            when it thinks something else fits the search better, so treat this as
            your best case, not a guarantee.
          </p>
        </div>
        <SerpPreview
          host={host}
          title={effectiveTitle}
          description={effectiveDescription}
        />
      </Card>

      <div className="flex justify-end">
        <Button
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              // Empty clears the override and restores the default — the
              // preview above already showed the merchant what that looks like.
              seo: {
                title: title.trim() || undefined,
                description: description.trim() || undefined,
              },
            })
          }
        >
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
