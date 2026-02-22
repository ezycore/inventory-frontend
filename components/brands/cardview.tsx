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
import { Edit2, Eye, MoreVertical, Package, Trash2 } from "lucide-react";
import Link from "next/link";

const BrandCardView = (brand, { onEdit, onView, onDelete }) => {
  const {
    name,
    description,
    status,
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
    <Card className="p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={images?.[0]?.url} alt={name} />
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {status}
            </Badge>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
            <MoreVertical className="h-4 w-4 cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
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

      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <Link href={`/products?brand=${_id}`} className="hover:underline">
          {productCount || 0} Products
        </Link>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <div>Created: {createdDate}</div>
        {updatedDate && <div>Updated: {updatedDate}</div>}
      </div>
    </Card>
  );
};

export default BrandCardView;
