import { useQuery } from "@tanstack/react-query";
import { repositories } from "@/services";

export const couponsQueryKey = ["coupons"] as const;

export const useCoupons = () =>
  useQuery({
    queryKey: couponsQueryKey,
    queryFn: () => repositories.coupons.list(),
    staleTime: Infinity,
  });
