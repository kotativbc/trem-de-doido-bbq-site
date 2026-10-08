import { useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

interface RunOptions {
  success?: string;
  invalidate?: QueryKey[];
}

/**
 * Executa uma operação de repositório com tratamento uniforme: avisa o resultado,
 * atualiza as consultas afetadas (o site público se atualiza junto) e devolve se deu certo.
 */
export const useAdminRun = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (operation: () => Promise<unknown>, options: RunOptions = {}): Promise<boolean> => {
      try {
        await operation();
        await Promise.all((options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
        if (options.success) toast.success(options.success);
        return true;
      } catch (error) {
        console.warn("[admin] operação falhou:", error);
        toast.error(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
        return false;
      }
    },
    [queryClient],
  );
};
