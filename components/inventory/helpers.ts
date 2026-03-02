import { Inventory } from "@/types";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  PackageX,
} from "lucide-react";

// Helper: Get stock level color and status
export const getStockLevelInfo = (quantity: number, alertLevel: number) => {
  if (quantity === 0) {
    return {
      status: "Out of Stock",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      progressColor: "bg-destructive",
      variant: "destructive" as const,
    };
  }
  if (quantity <= alertLevel) {
    return {
      status: "Low Stock",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      progressColor: "bg-chart-1",
      variant: "secondary" as const,
    };
  }
  if (quantity <= alertLevel * 1.5) {
    return {
      status: "Warning",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      progressColor: "bg-yellow-500",
      variant: "secondary" as const,
    };
  }
  return {
    status: "Healthy",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    progressColor: "bg-chart-2",
    variant: "default" as const,
  };
};

// Helper: Get restock status info (normal, ordered, hidden)
export const getRestockInfo = (restockStatus: string) => {
  switch (restockStatus) {
    case "ordered":
      return {
        label: "Ordered",
        color: "text-chart-4",
        bgColor: "bg-chart-4/10 border-chart-4/20",
        icon: RefreshCw,
      };
    case "hidden":
      return {
        label: "Hidden",
        color: "text-muted-foreground",
        bgColor: "bg-muted/50 border-muted",
        icon: PackageX,
      };
    default: // normal
      return {
        label: "Normal",
        color: "text-chart-2",
        bgColor: "bg-chart-2/10 border-chart-2/20",
        icon: Package,
      };
  }
};

// Prepare data for submit (create/update)
export const prepareSubmitData = (
  data: Inventory,
  isEdit: boolean,
  item: Inventory
) => {
  const submitData: any = {
    productId: data.productId,
    locationId: data.locationId,
    quantity: Number(data.quantity),
    quantityAlert: Number(data.quantityAlert),
    status: data.status,
    costPrice: Number(data.costPrice),
  };

  // Only include variantId if it has a value
  if (data.variantId && data.variantId !== "") {
    submitData.variantId = data.variantId;
  }

  if (isEdit && item) {
    submitData.id = item._id;
  }

  return submitData;
};
