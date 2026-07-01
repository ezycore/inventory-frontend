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
import { Edit2, MoreVertical, Package, Tag, Trash2 } from "lucide-react";
import { TruncatedText } from "@/components/shared/truncated-text";
import Link from "next/link";

const CategoryCardView = (
  category: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
) => {
  const { name, description, status, isDefault, createdAt, updatedAt, productCount, _id } = category;

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const updatedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Tag className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{name}</h3>
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
            <p className="text-sm text-muted-foreground/50 italic mt-0.5">
              No description
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
          <Link href={`/products?categoryId=${_id}`} className="hover:underline">
            {productCount || 0} Products
          </Link>
        ) : (
          <span>{productCount || 0} Products</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Created: {createdDate}</span>
        <span>Updated: {updatedDate}</span>
      </div>
    </Card>
  );
};

export default CategoryCardView;
