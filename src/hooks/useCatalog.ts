import { useQuery } from "@tanstack/react-query";
import { repositories } from "@/services";

export const catalogQueryKey = ["catalog"] as const;

export const useCatalog = () =>
  useQuery({
    queryKey: catalogQueryKey,
    queryFn: () => repositories.catalog.getCatalog(),
    staleTime: Infinity,
  });
