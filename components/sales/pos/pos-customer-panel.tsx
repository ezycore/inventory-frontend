"use client";
// coding-standard: maintained
import { useMemo, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { getCustomerFormConfig } from "@/components/sales";
import { CustomerBalanceChips } from "@/components/sales/sell/customer-balance-chips";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import DynamicForm from "@/ui/components/form";
import type { ColumnSpan, DynamicFormConfig } from "@/ui/components/form/type";
import { cn } from "@ui/lib/utils";
import { PosKbd } from "./pos-kbd";

/**
 * Customer + their discount — the same form New Sale uses (same config, same
 * `handleFieldChange`), so picking a customer still fills their default
 * discount into every line and the quick-add "+" still creates one.
 */
export function PosCustomerPanel({
  ctx,
  containerRef,
  className,
}: {
  ctx: SellPageContext;
  /** The F4 shortcut focuses the first control in here. */
  containerRef?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const t = useTranslations("sales.pos");
  const tForm = useTranslations("sales.sell.form");
  const config = useMemo((): DynamicFormConfig => {
    const base = getCustomerFormConfig(tForm);
    // The counter's column is narrow: the customer takes the room, the
    // discount % keeps a slot beside it.
    return {
      ...base,
      fields: base.fields.map((field) => ({
        ...field,
        columnSpan: (field.name === "customerId" ? 8 : 4) as ColumnSpan,
      })),
    };
  }, [tForm]);

  return (
    <section
      ref={containerRef}
      className={cn("space-y-2 rounded-xl border bg-card p-3 shadow-xs", className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("customer")}
        </span>
        <PosKbd className="hidden lg:inline-flex">F4</PosKbd>
      </div>
      <DynamicForm
        form={ctx.customerForm}
        config={config}
        onFieldChange={ctx.handleFieldChange}
        hideCancel
      />
      <CustomerBalanceChips ctx={ctx} />
    </section>
  );
}
