import type React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
import NotFound from "@/pages/NotFound";
import { repositories } from "@/services";
import CategoriesPage from "@/admin/pages/CategoriesPage";
import ProductsPage from "@/admin/pages/ProductsPage";
import EditorLayout from "./EditorLayout";

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">{children}</div>
);

/**
 * Editor do cardápio, aberto por um link com código secreto (/gerenciar/<código>).
 * Quem não tem o código certo vê a mesma página 404 de qualquer endereço inexistente:
 * nada revela que existe um editor.
 */
const EditorRoutes = () => {
  const { token = "" } = useParams();
  const access = useQuery({
    queryKey: ["editor-access", token],
    queryFn: () => repositories.editor.authorize(token),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  const authorized = access.data === true;
  usePageMeta(authorized ? "Editor do cardápio | Trem de Doido BBQ" : "Página não encontrada | Trem de Doido BBQ", { noindex: true });

  if (access.isPending) {
    return (
      <Screen>
        <div role="status" aria-label="Verificando acesso" className="w-full max-w-sm">
          <Skeleton className="h-24 w-full" />
        </div>
      </Screen>
    );
  }

  if (access.isError) {
    return (
      <Screen>
        <div role="alert" className="max-w-md space-y-4 text-center">
          <p className="text-foreground">Não foi possível abrir o editor agora.</p>
          <p className="text-sm text-muted-foreground">{access.error instanceof Error ? access.error.message : "Tente novamente."}</p>
          <Button onClick={() => void access.refetch()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Tentar novamente
          </Button>
        </div>
      </Screen>
    );
  }

  if (!authorized) return <NotFound />;

  return (
    <Routes>
      <Route element={<EditorLayout token={token} />}>
        <Route index element={<ProductsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to={`/gerenciar/${token}`} replace />} />
      </Route>
    </Routes>
  );
};

export default EditorRoutes;
