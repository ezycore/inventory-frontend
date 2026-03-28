import type { PurchaseOrderStatus } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
} from "lucide-react";

export interface StatusDisplayConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}

export type PurchaseStatusConfig = Record<
  PurchaseOrderStatus,
  StatusDisplayConfig
>;

export const statusConfig: PurchaseStatusConfig = {
  draft: {
    label: "Draft",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  ordered: {
    label: "Ordered",
    variant: "outline",
    icon: <Package className="h-3 w-3" />,
  },
  partial: {
    label: "Partial",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  received: {
    label: "Received",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};
