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
import { Edit2, MoreVertical, Package, Tag, Trash2 } from "lucide-react";
import { TruncatedText } from "@/components/shared/truncated-text";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Translator, AppLocale } from "@/i18n/config";

const CategoryCardView = (
  category: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  const { name, description, status, isDefault, images, createdAt, updatedAt, productCount, _id } = category;

  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale);
  const updatedDate = formatDate(updatedAt, "dd MMM yyyy", locale);

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
        {productCount > 0 ? (
          <Link href={`/products?categoryId=${_id}`} className="hover:underline">
            {t("card.productsCount", { count: productCount || 0 })}
          </Link>
        ) : (
          <span>{t("card.productsCount", { count: productCount || 0 })}</span>
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
