"use client";
// coding-standard: maintained

import { notFound, useParams } from "next/navigation";
import { ArrangeProducts } from "@/components/ecommerce/arrange/arrange-products";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useNavLabels } from "@/hooks/use-nav-labels";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { storefrontUrl } from "@/lib/storefront-url";
import { useSelectOptions, useStorefrontCollections, type ProductOrderTarget } from "@/services/api";
import { selectOptions } from "@/services/api/select-options";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontCollection } from "@/types/api";
import type { SelectOption } from "@/ui/components/form/type";

/** `/ecommerce/arrange/all`, `/ecommerce/arrange/category/<id>`, `/ecommerce/arrange/tag/<id>`. */
function targetOf(segments: string[]): ProductOrderTarget | null {
  const [scope, id, ...rest] = segments;
  if (rest.length > 0) return null;
  if (scope === "all" && !id) return { scope: "all" };
  if ((scope === "category" || scope === "tag") && id) return { scope, id };
  return null;
}

const TAG_OPTIONS = selectOptions("tags", { fields: "_id,name,slug" });

/**
 * Arrange one storefront listing (inventory-backend
 * `docs/plan/storefront-product-order.md` §7). Reached from Online Store →
 * Collections (All products, and each collection) and from Products → Tags.
 *
 * This page only resolves the target's name, where the merchant came from (the
 * back link and the breadcrumb root) and its address in the shop; the screen
 * itself is `ArrangeProducts`.
 */
export default function ArrangeProductsPage() {
  const segments = useParams().target;
  const target = targetOf(Array.isArray(segments) ? segments : segments ? [segments] : []);
  const slug = useAuthStore((state) => state.user?.organization?.slug);
  const { data: collections } = useStorefrontCollections();
  const { data: tags } = useSelectOptions(target?.scope === "tag" ? TAG_OPTIONS : null);
  const { itemLabel } = useNavLabels();

  if (!target) notFound();

  const base = slug ? storefrontUrl(slug) : undefined;
  const screen = screenFor(target, base, collections, tags);
  usePageBreadcrumbs([
    { title: itemLabel(screen.backLabel), link: screen.backHref },
    { title: `Arrange ${screen.title}` },
  ]);

  return (
    <ArrangeProducts
      // A fresh screen per listing: the working copy must not follow the merchant to another one.
      key={target.scope === "all" ? "all" : `${target.scope}:${target.id}`}
      target={target}
      {...screen}
    />
  );
}

type Screen = { title: string; backHref: string; backLabel: string; storeHref?: string };

/** The listing's name, where the merchant came from, and its address in the shop. */
function screenFor(
  target: ProductOrderTarget,
  base: string | undefined,
  collections: StorefrontCollection[] | undefined,
  tags: SelectOption[] | undefined,
): Screen {
  const fromCollections = { backHref: "/ecommerce/collections", backLabel: "Collections" };
  if (target.scope === "all") {
    return { ...fromCollections, title: "All products", storeHref: base ? storeHref(base, "/products") : undefined };
  }
  if (target.scope === "category") {
    const category = collections?.find((c) => c._id === target.id);
    return {
      ...fromCollections,
      title: category ? category.storefront?.displayName || category.name : "collection",
      storeHref: base && category ? collectionHref(base, category) : undefined,
    };
  }
  const tag = tags?.find((option) => option.value === target.id) as (SelectOption & { slug?: string }) | undefined;
  return {
    backHref: "/tags",
    backLabel: "Tags",
    title: tag ? `tag “${tag.label}”` : "tag",
    storeHref: base && tag?.slug ? storeHref(base, `/products?tags=${encodeURIComponent(tag.slug)}`) : undefined,
  };
}
