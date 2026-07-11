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
import { Edit2, MoreVertical, Percent, Hash, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Translator } from "@/i18n/config";
import type { AppLocale } from "@/i18n/config";

const typeStyles: Record<string, { bg: string; icon: typeof Percent }> = {
  percentage: { bg: "bg-violet-100 text-violet-700", icon: Percent },
  fixed: { bg: "bg-amber-100 text-amber-700", icon: Hash },
};

const TaxCardView = (
  tax: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  const { name, rate, type, status, isDefault, createdAt } = tax;

  const typeConfig = typeStyles[type] || typeStyles.percentage;
  const TypeIcon = typeConfig.icon;
  const displayValue = type === "percentage" ? `${rate}%` : `৳${Number(rate).toLocaleString()}`;

  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale);

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60">
      {/* Top color accent bar */}
      <div
        className={`h-1 w-full ${
          type === "percentage"
            ? "bg-gradient-to-r from-violet-500 to-purple-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Icon badge */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${typeConfig.bg}`}
            >
              <TypeIcon className="h-5.5 w-5.5" />
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="font-semibold text-base truncate leading-tight">
                {name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={status === "active" ? "default" : "secondary"}
                  className="text-[11px] px-2 py-0"
                >
                  {status === "active" ? t("form.active") : t("form.inactive")}
                </Badge>
                <Badge variant="outline" className="text-[11px] px-2 py-0 capitalize">
                  {type === "percentage" ? t("form.percentage") : t("form.fixed")}
                </Badge>
                {isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[11px] px-2 py-0 border-primary text-primary"
                  >
                    {t("card.default")}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
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

        {/* Rate highlight */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">{t("card.taxRate")}</span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            {displayValue}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <span>{t("card.createdOn", { date: createdDate })}</span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              status === "active" ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            {status === "active" ? t("card.inUse") : t("card.disabled")}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default TaxCardView;
