// coding-standard: maintained
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { CornerDownRight, Edit2, FolderInput, MoreVertical, Package, Percent, Tag, Trash2 } from "lucide-react";
import { TruncatedText } from "@/components/shared/truncated-text";
import { categoryProductsHref } from "./helper";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import type { Translator, AppLocale } from "@/i18n/config";
// NOTE: the legacy hand-written `Category` in types/index.ts, not the generated
// `Category` — the page's `operations` are typed with it. The two duplicate
// each other and should be reconciled; typed either way beats `any`.
import type { Category } from "@/types";
// The hand-written `Category` (types/index.ts), which the page's `operations` are
// typed with. It duplicates the generated `Category` and differs only in
// required-vs-optional — reconciling the two is a separate cleanup. It is at
// least ACCURATE now: `isDefault` really is top-level (it was declared inside
// `storefront` in the model, so it never persisted).

/**
 * Typed against the generated `Category`, deliberately — not `any`.
 *
 * A card renderer taking `any` opts out of the generated contract, so a field
 * removed on the backend keeps compiling and fails silently at runtime. That is
 * exactly how the taxes card kept reading a deleted `Tax.type` and rendered
 * every rate as a currency amount.
 */
const CategoryCardView = (
  category: Category,
  {
    onEdit,
    onDelete,
    onApplyVat,
    onMoveProducts,
  }: {
    onEdit?: () => void;
    onDelete?: () => void;
    /**
     * Re-point this category's products at its default VAT rate. Passed only
     * when VAT is on, the user may edit products, AND the category has a default
     * — the card view is this page's DEFAULT view, so leaving the action out of
     * it would hide the feature from most users.
     */
    onApplyVat?: () => void;
    /** Move every product out of this category — passed only when the user may edit products. */
    onMoveProducts?: () => void;
  },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  // `parentId` says WHETHER this is a sub-category; `parent` carries the name to
  // show. Two fields on purpose — the edit form binds its parent select to the
  // raw id, so the backend cannot populate it in place. `parent` is a plain
  // lookup that can miss (a parent deleted out from under a child), hence the
  // generic label as a fallback rather than a gap. Same contract as the table
  // column, which is the view this card is read side-by-side with.
  const {
    name, description, status, isDefault, images, createdAt, updatedAt,
    productCount, parentId, parent,
  } = category;

  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale, getOrgTimezone());
  const updatedDate = formatDate(updatedAt, "dd MMM yyyy", locale, getOrgTimezone());

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-4">
      <div className="flex items-start gap-4">
        {/* Image / icon fallback */}
        <Avatar className="h-11 w-11 rounded-lg shrink-0">
          <AvatarImage src={images?.[0]?.url} alt={name} className="object-cover" />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
            <Tag className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{name}</h3>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {status === "active" ? t("filters.statusActive") : t("filters.statusInactive")}
            </Badge>
            {isDefault && (
              <Badge
                variant="outline"
                className="text-xs shrink-0 border-primary text-primary"
              >
                {t("card.default")}
              </Badge>
            )}
          </div>
          {description ? (
            <TruncatedText
              text={description}
              lines={1}
              className="text-sm text-muted-foreground mt-0.5"
            />
          ) : (
            <p className="text-sm text-muted-foreground/50 italic mt-0.5">
              {t("card.noDescription")}
            </p>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors group-hover:opacity-100">
            <MoreVertical className="h-4 w-4 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              {t("card.edit")}
            </DropdownMenuItem>
            {onApplyVat && (
              <DropdownMenuItem onClick={onApplyVat}>
                <Percent className="h-4 w-4 mr-2" />
                {t("applyVat.menuItem")}
              </DropdownMenuItem>
            )}
            {onMoveProducts && productCount > 0 && (
              <DropdownMenuItem onClick={onMoveProducts}>
                <FolderInput className="h-4 w-4 mr-2" />
                {t("moveProducts.menuItem")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t("card.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 shrink-0">
          <Package className="h-4 w-4" />
          {productCount > 0 ? (
            <Link href={categoryProductsHref(category)} className="hover:underline">
              {t("card.productsCount", { count: productCount || 0 })}
            </Link>
          ) : (
            <span>{t("card.productsCount", { count: productCount || 0 })}</span>
          )}
        </div>

        {/* Parent — a sub-category is otherwise indistinguishable from a
            top-level one on a flat grid, and the two behave differently (no
            default flag, no own VAT rate, a two-segment URL). */}
        {parentId ? (
          <span className="flex items-center gap-1.5 min-w-0" title={parent?.name}>
            <CornerDownRight className="h-4 w-4 shrink-0" />
            <span className="truncate">{parent?.name ?? t("card.subcategory")}</span>
          </span>
        ) : (
          <Badge variant="secondary" className="text-xs shrink-0">
            {t("card.topLevel")}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>{t("card.createdOn", { date: createdDate })}</span>
        <span>{t("card.updatedOn", { date: updatedDate })}</span>
      </div>
    </Card>
  );
};

export default CategoryCardView;
