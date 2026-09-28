// coding-standard: maintained
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Edit2, MoreVertical, Package, TagsIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { TruncatedText } from "@/components/shared/truncated-text";
import { formatDate } from "@/lib/format";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import type { Translator, AppLocale } from "@/i18n/config";
import type { TagListItem } from "@/types/api";

/**
 * Typed against the generated `TagListItem`, deliberately — a card renderer
 * taking `any` opts out of the generated contract, so a field removed on the
 * backend keeps compiling and fails silently at runtime.
 *
 * No avatar, unlike the brand and category cards: a tag carries no image. The
 * chip itself, in the merchant's chosen colour, IS the identity — and it renders
 * here exactly as it does on a product row.
 */
const TagCardView = (
  tag: TagListItem,
  {
    onEdit,
    onDelete,
    onRemoveFromProducts,
  }: {
    onEdit?: () => void;
    onDelete?: () => void;
    /** Take this tag off every product — passed only when the user may edit products. */
    onRemoveFromProducts?: () => void;
  },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  const { name, description, status, color, productCount, updatedAt, createdAt, _id } =
    tag;

  const updatedDate = formatDate(updatedAt, "dd MMM yyyy", locale, getOrgTimezone());
  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale, getOrgTimezone());
  const count = productCount ?? 0;

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-sm font-semibold"
              style={color ? { borderColor: color, color } : undefined}
            >
              {name}
            </Badge>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {status === "active"
                ? t("filters.statusActive")
                : t("filters.statusInactive")}
            </Badge>
          </div>
          {description ? (
            <TruncatedText
              text={description}
              lines={1}
              className="text-sm text-muted-foreground mt-1.5"
            />
          ) : (
            <p className="text-sm text-muted-foreground/50 italic mt-1.5">
              {t("card.noDescription")}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
            <MoreVertical className="h-4 w-4 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              {t("card.edit")}
            </DropdownMenuItem>
            {onRemoveFromProducts && count > 0 && (
              <DropdownMenuItem onClick={onRemoveFromProducts}>
                <TagsIcon className="h-4 w-4 mr-2" />
                {t("removeFromProducts.menuItem")}
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

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        {count > 0 ? (
          <Link href={`/products?tags=${_id}`} className="hover:underline">
            {t("card.productsCount", { count })}
          </Link>
        ) : (
          <span>{t("card.productsCount", { count })}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <div>{t("card.createdOn", { date: createdDate })}</div>
        {updatedDate && <div>{t("card.updatedOn", { date: updatedDate })}</div>}
      </div>
    </Card>
  );
};

export default TagCardView;
