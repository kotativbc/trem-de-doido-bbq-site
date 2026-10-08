import { useQuery } from "@tanstack/react-query";
import { repositories } from "@/services";

export const ordersQueryKey = ["orders"] as const;

export const useOrders = () =>
  useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => repositories.orders.list(),
    staleTime: 0,
  });

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: [...ordersQueryKey, id],
    queryFn: () => repositories.orders.get(id ?? ""),
    enabled: Boolean(id),
    staleTime: 0,
  });
