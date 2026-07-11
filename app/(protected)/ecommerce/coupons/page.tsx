"use client";

import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  couponsApi,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
  type Coupon,
} from "@/services/api";
import {
  couponColumns,
  couponDefaultValues,
  couponFilterConfig,
  couponFormConfig,
  couponSearchConfig,
} from "@/components/ecommerce/coupons";

// Optional caps/limits: empty / 0 / NaN all mean "unset" (no cap, unlimited).
const toNum = (v: unknown): number | undefined => {
  const n = Number(v);
  return v === "" || v == null || Number.isNaN(n) || n === 0 ? undefined : n;
};

function cleanCoupon(data: Record<string, any>) {
  return {
    code: String(data.code ?? "").trim().toUpperCase(),
    type: data.type,
    value: Number(data.value) || 0,
    validFrom: data.validFrom || undefined,
    validUntil: data.validUntil || undefined,
    minOrderValue: toNum(data.minOrderValue),
    maxUses: toNum(data.maxUses),
    perShopperLimit: toNum(data.perShopperLimit),
    maxDiscountAmount: toNum(data.maxDiscountAmount),
    status: data.status,
  };
}

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subTitle="Create and manage storefront discount codes"
      />

      <DataTable<Coupon>
        cardTitle={(n) => `All Coupons (${n})`}
        columns={couponColumns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        filterConfig={couponFilterConfig}
        searchConfig={couponSearchConfig}
        enableSorting
        enableRowHover
        operations={{
          formConfig: couponFormConfig,
          defaultValues: couponDefaultValues,
          getAllData: couponsApi.getAll,
          createMutation: useCreateCoupon(),
          updateMutation: useUpdateCoupon(),
          deleteMutation: useDeleteCoupon(),
          queryKey: ["coupons"],
          entityName: "Coupon",
          editTooltip: "Edit coupon",
          deleteTooltip: "Delete coupon",
          // Map the row into form-shaped values (numeric defaults, ISO dates
          // the DatePicker can parse) so edit pre-fill never produces "".
          transformEditData: (c: Coupon) => ({
            code: c.code,
            type: c.type,
            value: c.value ?? 0,
            validFrom: c.validFrom ?? "",
            validUntil: c.validUntil ?? "",
            minOrderValue: c.minOrderValue ?? 0,
            maxUses: c.maxUses ?? 0,
            perShopperLimit: c.perShopperLimit ?? 0,
            maxDiscountAmount: c.maxDiscountAmount ?? 0,
            status: c.status,
          }),
          // Create → flat CouponInput; edit → { body } (DataTable injects id),
          // matching useUpdateCoupon's { id, body } signature.
          prepareSubmitData: (data: Coupon, isEdit: boolean) => {
            const body = cleanCoupon(data);
            return isEdit ? { body } : body;
          },
        }}
      />
    </div>
  );
}
