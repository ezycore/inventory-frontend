import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { couponsApi, type CouponInput } from "./api";

export const useCoupons = () =>
  useQuery({
    queryKey: queryKeys.coupons.list(),
    queryFn: () => couponsApi.list(),
    select: (r) => r.data,
  });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CouponInput) => couponsApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Coupon created");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: Partial<CouponInput> }) =>
      couponsApi.update(v.id, v.body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Coupon updated");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Coupon deleted");
      invalidate(qc, "storefront.catalog.changed");
    },
    onError: handleMutationError,
  });
};
