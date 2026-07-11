"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Package, Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { StatusBadge } from "@/ui/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";

interface ProductCardProps {
  product: any;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
}

export function ProductCard({ product, onEdit, onView, onDelete }: ProductCardProps) {
  const t = useTranslations("products.products");
  const thumbnailUrl = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;
  const categoryName = product.category?.name || t("columns.uncategorized");
  const brandName = product.brand?.name;
  const price = product.price;
  const productType = product.productType;

  return (
    <Card className="p-0 gap-0 group overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted/50 to-muted">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Status overlay (top-left) */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={product.status} />
        </div>

        {/* Actions overlay (top-right) */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("card.viewDetails")}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("card.edit")}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("card.delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Type badge (bottom-right) */}
        {productType && (
          <div className="absolute bottom-2.5 right-2.5">
            <Badge
              variant={productType === "variable" ? "secondary" : "outline"}
              className={cn(
                "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5",
                productType === "variable"
                  ? "bg-violet-500/90 text-white border-violet-500/90 backdrop-blur-sm"
                  : "bg-background/90 backdrop-blur-sm"
              )}
            >
              {productType}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3.5 space-y-2.5">
        {/* Category */}
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate mb-1">
          {categoryName}
        </p>

        {/* Product Name */}
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={onView}
        >
          {product.name}
        </h3>

        {/* Price & Brand Row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex flex-col">
            {price ? (
              <span className="text-base font-bold text-foreground tabular-nums">
                ৳{Number(price).toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                {t("card.noPrice")}
              </span>
            )}
          </div>
          {brandName && (
            <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full truncate max-w-[45%]">
              {brandName}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
