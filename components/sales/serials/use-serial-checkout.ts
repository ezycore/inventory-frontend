// coding-standard: maintained
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { SerialKind } from "@/components/sales/types";
import { useConfirm } from "@/hooks/use-confirm";
import { normalizeSerials } from "@/utils/serial";
import { useSerialKindOf } from "./use-serial-kinds";

interface CheckoutLine {
  productName: string;
  quantity: number;
  inventoryId: string;
  isCombo?: boolean;
  serialKind?: SerialKind;
  serials?: string[];
}

/**
 * The checkout's serial gate. More codes than units on a line stops the sale
 * (the server would refuse it too). Missing codes never stop it — decision 4
 * of `docs/plan/sale-serials.md` — they only ask once, because a manager can
 * add them on the sale afterwards.
 */
export function useSerialCheckout() {
  const t = useTranslations("sales.serials");
  const kindOf = useSerialKindOf();
  const { confirm, ConfirmDialog } = useConfirm();

  const check = useCallback(
    async (lines: readonly CheckoutLine[]): Promise<boolean> => {
      let missing = 0;
      for (const line of lines) {
        const count = normalizeSerials(line.serials).length;
        if (count > line.quantity) {
          toast.error(t("tooMany", { product: line.productName }));
          return false;
        }
        if (kindOf(line)) missing += line.quantity - count;
      }
      if (missing === 0) return true;
      return confirm({
        title: t("missingConfirmTitle"),
        description: t("missingConfirmDescription", { count: missing }),
        confirmLabel: t("missingConfirm"),
        cancelLabel: t("cancel"),
      });
    },
    [confirm, kindOf, t],
  );

  return { check, ConfirmDialog };
}
