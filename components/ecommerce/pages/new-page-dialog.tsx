"use client";
// coding-standard: maintained

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, FileText, Loader2, Package, Rocket, type LucideIcon } from "lucide-react";
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

/**
 * "New landing page": a starting point, the product it sells, and a name
 * (backend plan storefront-builder §9). The page is created with the template's
 * sections as its first draft, in one request, and the merchant lands in the
 * editor. The backend picks a free address, hides the page from search engines
 * and gives it the minimal header.
 */
export function NewPageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateStorefrontPage();
  const [templateId, setTemplateId] = useState<PageTemplateId>("single-product");
  const [productId, setProductId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const template = pageTemplate(templateId);
  const name = title.trim();
  const ready = !!name && (!template.needsProduct || !!productId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready || create.isPending) return;
    create.mutate(
      { title: name, sections: templateSections(template, productId) },
      {
        onSuccess: (res) => {
          if (!res.data) return;
          setTitle("");
          setProductId(undefined);
          setTemplateId("single-product");
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New landing page</DialogTitle>
            <DialogDescription>
              Pick a starting point. Everything on it can be changed in the editor.
            </DialogDescription>
          </DialogHeader>

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

          {template.needsProduct ? (
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
              placeholder="Eid offer"
            />
            <p className="text-xs text-muted-foreground">
              For you — shoppers do not see it. It also makes the page&apos;s address.
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
