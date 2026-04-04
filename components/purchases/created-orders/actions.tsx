import type { PurchaseOrder } from "@/types";
import type { CustomAction } from "@/types/DataTable";
import { Eye, PackageCheck, XCircle } from "lucide-react";

interface GetCreatedOrderActionsParams {
  onViewOrder: (order: PurchaseOrder) => void;
  onConfirmOrder: (order: PurchaseOrder) => void;
  onCancelOrder: (order: PurchaseOrder) => void;
}

export const getCreatedOrderActions = ({
  onViewOrder,
  onConfirmOrder,
  onCancelOrder,
}: GetCreatedOrderActionsParams): CustomAction[] => [
  {
    type: "custom",
    placement: "cell",
    icon: <Eye className="h-4 w-4" />,
    label: "View Details",
    tooltip: "View order details",
    onClick: (row) => onViewOrder(row as PurchaseOrder),
  },
  {
    type: "custom",
    placement: "cell",
    icon: <PackageCheck className="h-4 w-4" />,
    label: "Confirm Order",
    tooltip: "Receive items from this order",
    onClick: (row) => onConfirmOrder(row as PurchaseOrder),
    disabled: (row) => {
      const order = row as PurchaseOrder;
      return order.status !== "ordered" && order.status !== "partial";
    },
  },
  {
    type: "custom",
    placement: "cell",
    icon: <XCircle className="h-4 w-4" />,
    label: "Cancel Order",
    tooltip: "Cancel this order",
    onClick: (row) => onCancelOrder(row as PurchaseOrder),
    disabled: (row) => {
      const order = row as PurchaseOrder;
      return order.status !== "ordered" && order.status !== "draft";
    },
  },
];
