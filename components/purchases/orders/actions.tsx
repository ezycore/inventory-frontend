// coding-standard: maintained
import type { PurchaseOrder } from "@/types";
import type { CustomAction } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";
import { Edit3, Eye } from "lucide-react";

interface GetCreatedOrderActionsParams {
  onViewOrder: (order: PurchaseOrder) => void;
  onEditOrder: (order: PurchaseOrder) => void;
  /** Bound to the `purchases` namespace; keys are read as `orders.action*`. */
  t: Translator;
}

export const getCreatedOrderActions = ({
  onViewOrder,
  onEditOrder,
  t,
}: GetCreatedOrderActionsParams): CustomAction[] => [
  {
    type: "custom",
    placement: "cell",
    icon: <Eye className="h-4 w-4" />,
    label: t("orders.actionView"),
    tooltip: t("orders.actionViewTooltip"),
    onClick: (row) => onViewOrder(row as PurchaseOrder),
  },
  {
    type: "custom",
    placement: "cell",
    icon: <Edit3 className="h-4 w-4" />,
    label: t("orders.actionEdit"),
    tooltip: t("orders.actionEditTooltip"),
    onClick: (row) => onEditOrder(row as PurchaseOrder),
    disabled: (row) => {
      const order = row as PurchaseOrder;
      // Only draft / ordered orders are editable (backend rule).
      return order.status !== "ordered" && order.status !== "draft";
    },
  },
];
