import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import { couponsApi, type CouponInput } from "./api";

const ROOT = ["coupons"] as const;

export const useCoupons = () =>
  useQuery({
    queryKey: ROOT,
    queryFn: () => couponsApi.list(),
    select: (r) => r.data,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ROOT });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CouponInput) => couponsApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Coupon created");
      invalidate(qc);
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
      invalidate(qc);
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
      invalidate(qc);
    },
    onError: handleMutationError,
  });
};
