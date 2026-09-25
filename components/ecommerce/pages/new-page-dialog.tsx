"use client";
// coding-standard: maintained

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, FileText, Loader2, Megaphone, Package, Rocket, Store, type LucideIcon } from "lucide-react";
import { useCreateStorefrontPage } from "@/services/api";
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
import { OptionCard } from "@/ui/components/option-card";
import { RefField } from "@/components/ecommerce/pages/editor/ref-field";
import { useStoreFacts } from "@/components/ecommerce/pages/editor/use-store-facts";
import {
  PAGE_TEMPLATES,
  pageTemplate,
  templateSections,
  type PageTemplateId,
} from "@/components/ecommerce/pages/page-templates";

/** The backend's title limit (`createStorefrontPageSchema`). */
const TITLE_MAX = 160;

const TEMPLATE_ICONS: Record<PageTemplateId, LucideIcon> = {
  "single-product": Package,
  offer: BadgePercent,
  launch: Rocket,
  blank: FileText,
};

/** The two kinds a merchant makes. What each one is, in their words. */
type PageKind = "content" | "landing";

/** What the dialog opens on — a kind, and for a store page possibly its name. */
export interface NewPageStart {
  kind?: PageKind;
  title?: string;
}

/** The store pages nearly every shop has; one tap names the page. */
export const STORE_PAGE_STARTERS = ["About us", "Contact", "Return & Refund Policy", "Privacy Policy", "Terms"];

const KINDS: { id: PageKind; label: string; description: string; icon: LucideIcon }[] = [
  {
    id: "content",
    label: "Store page",
    description: "About, Contact, a policy. Sits in your footer and is found by Google.",
    icon: Store,
  },
  {
    id: "landing",
    label: "Landing page",
    description: "For an ad or an offer. Its own address, hidden from Google.",
    icon: Megaphone,
  },
];

/**
 * "New page" — **one** button for both kinds a merchant makes, with the kind as
 * the first question (plan `pages-and-settings-consolidation.md` §3.2).
 *
 * One button rather than one per table, for three reasons. The store-pages table
 * hides itself when a store has none, so a button of its own would be missing for
 * exactly the merchant who needs it. A merchant thinks "I want a new page", not
 * "which of these four cards is mine". And the kind is not cosmetic: it decides
 * the header and footer, whether search engines are invited, and whether the page
 * joins the footer column — four defaults that differ in opposite directions, so
 * asking once and up front is the honest way to set them.
 *
 * A **store page** needs nothing but a name: it is created with its own empty
 * body section and opens on the rich-text editor. The usual ones are offered as
 * one-tap names. The Pages list's empty states open this dialog already pointed
 * somewhere (`start`): a landing page, or a store page with its name picked. The
 * parent remounts it per open, via `key`, so the start is read fresh each time. A **landing page** picks a
 * starting point and the product it sells; the page is created with that
 * template's sections as its first draft, in one request.
 */
export function NewPageDialog({
  open,
  onOpenChange,
  start,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  start?: NewPageStart;
}) {
  const router = useRouter();
  const create = useCreateStorefrontPage();
  const store = useStoreFacts();
  const [kind, setKind] = useState<PageKind>(start?.kind ?? "content");
  const [templateId, setTemplateId] = useState<PageTemplateId>("single-product");
  const [productId, setProductId] = useState<string | undefined>();
  const [title, setTitle] = useState(start?.title ?? "");
  const template = pageTemplate(templateId);
  const landing = kind === "landing";
  const name = title.trim();
  const ready = !!name && (!landing || !template.needsProduct || !!productId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready || create.isPending) return;
    create.mutate(
      {
        kind,
        title: name,
        // A store page's own section is the backend's to add: it is the one
        // section the page must have, and it starts empty.
        ...(landing ? { sections: templateSections(template, productId, store) } : {}),
      },
      {
        onSuccess: (res) => {
          if (!res.data) return;
          setTitle("");
          setProductId(undefined);
          setTemplateId("single-product");
          setKind("content");
          onOpenChange(false);
          router.push(`/ecommerce/pages/${res.data._id}`);
        },
      },
    );
  };

  return (
    // Closing is held while the request is out, so the merchant is not left
    // wondering whether a page was made.
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New page</DialogTitle>
            <DialogDescription>
              Everything on it can be changed in the editor afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>What kind of page?</Label>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Kind of page">
              {KINDS.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={option.id === kind}
                  onSelect={() => setKind(option.id)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          </div>

          {!landing ? (
            <div className="space-y-2">
              <Label>Start from</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common store pages">
                {STORE_PAGE_STARTERS.map((starter) => (
                  <Button
                    key={starter}
                    type="button"
                    size="sm"
                    variant={title.trim() === starter ? "default" : "outline"}
                    aria-pressed={title.trim() === starter}
                    className="h-9 rounded-full"
                    onClick={() => setTitle(starter)}
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {landing ? (
            <div className="space-y-2">
              <Label>Starting point</Label>
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Starting point">
                {PAGE_TEMPLATES.map((option) => (
                  <OptionCard
                    key={option.id}
                    selected={option.id === templateId}
                    onSelect={() => setTemplateId(option.id)}
                    icon={TEMPLATE_ICONS[option.id]}
                    label={option.label}
                    description={option.description}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {landing && template.needsProduct ? (
            <div className="space-y-2">
              <Label htmlFor="new-page-product">Product</Label>
              <RefField
                id="new-page-product"
                to="product"
                value={productId}
                onChange={(next) => setProductId(typeof next === "string" ? next : undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Its photos, price and description fill the page, and stay up to date when you change
                the product.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="new-page-title">Page name</Label>
            <Input
              id="new-page-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX}
              placeholder={landing ? "Eid offer" : "Return & Refund Policy"}
            />
            <p className="text-xs text-muted-foreground">
              {landing
                ? "For you — shoppers do not see it. It also makes the page’s address."
                : "Shoppers see this in your footer, and it makes the page’s address."}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create and open editor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
