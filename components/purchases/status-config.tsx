// coding-standard: maintained
import type { PurchaseOrderStatus } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
} from "lucide-react";

export interface StatusDisplayConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}

export type PurchaseStatusConfig = Record<
  PurchaseOrderStatus,
  StatusDisplayConfig
>;

/** Visual config per status; the display label comes from `purchases.status.*` messages. */
export const statusConfig: PurchaseStatusConfig = {
  draft: {
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  ordered: {
    variant: "outline",
    icon: <Package className="h-3 w-3" />,
  },
  partial: {
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  received: {
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};
