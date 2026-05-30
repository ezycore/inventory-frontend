import type { PurchaseOrder } from "@/types";
import type { CustomAction } from "@/types/DataTable";
import { Edit3, Eye } from "lucide-react";

interface GetCreatedOrderActionsParams {
  onViewOrder: (order: PurchaseOrder) => void;
  onEditOrder: (order: PurchaseOrder) => void;
}

export const getCreatedOrderActions = ({
  onViewOrder,
  onEditOrder,
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
    icon: <Edit3 className="h-4 w-4" />,
    label: "Edit Order",
    tooltip: "Edit items, quantities and prices",
    onClick: (row) => onEditOrder(row as PurchaseOrder),
    disabled: (row) => {
      const order = row as PurchaseOrder;
      // Only draft / ordered orders are editable (backend rule).
      return order.status !== "ordered" && order.status !== "draft";
    },
  },
];
