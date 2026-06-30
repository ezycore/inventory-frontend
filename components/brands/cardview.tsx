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
import { Edit2, MoreVertical, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { TruncatedText } from "@/components/shared/truncated-text";

const BrandCardView = (brand, { onEdit, onDelete }) => {
  const {
    name,
    description,
    status,
    isDefault,
    productCount,
    updatedAt,
    createdAt,
    images,
    _id,
  } = brand;

  const updatedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={images?.[0]?.url} alt={name} />
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {status}
            </Badge>
            {isDefault && (
              <Badge
                variant="outline"
                className="text-xs shrink-0 border-primary text-primary"
              >
                Default
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
            <p className="text-sm text-muted-foreground/50 italic mt-0.5">-</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
            <MoreVertical className="h-4 w-4 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        {productCount > 0 ? (
          <Link href={`/products?brandId=${_id}`} className="hover:underline">
            {productCount || 0} Products
          </Link>
        ) : (
          <span>{productCount || 0} Products</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <div>Created: {createdDate}</div>
        {updatedDate && <div>Updated: {updatedDate}</div>}
      </div>
    </Card>
  );
};

export default BrandCardView;
