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
import { Edit2, MoreVertical, Palette, Trash2 } from "lucide-react";
import { ValuesPopover } from "@/components/shared/values-popover";
import { formatDate } from "@/lib/format";
import type { Translator, AppLocale } from "@/i18n/config";

const VariantCardView = (
  variant: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  const { name, values = [], status, createdAt } = variant;

  const allValues = Array.isArray(values) ? values : [];

  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale);
  const updatedDate = formatDate(variant.updatedAt, "dd MMM yyyy", locale);

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-3">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 shrink-0">
          <Palette className="h-5 w-5 text-purple-600" />
        </div>

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
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("card.valuesCount", { count: allValues.length })}
          </p>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
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

      {/* Values grid - show 5 values then popover for the rest */}
      {allValues.length > 0 && (
        <div className="pt-2">
          <ValuesPopover values={allValues} maxVisible={5} colorized />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>{t("card.createdOn", { date: createdDate })}</span>
        <span>{t("card.updatedOn", { date: updatedDate })}</span>
      </div>
    </Card>
  );
};

export default VariantCardView;
