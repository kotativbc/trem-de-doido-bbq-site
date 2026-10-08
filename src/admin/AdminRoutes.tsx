import { Navigate, Route, Routes } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAuthProvider } from "./AdminAuthProvider";
import { useAdminAuth } from "./adminAuthContext";
import AdminLayout from "./AdminLayout";
import CategoriesPage from "./pages/CategoriesPage";
import CouponsPage from "./pages/CouponsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OrdersPage from "./pages/OrdersPage";
import ProductsPage from "./pages/ProductsPage";
import SettingsPage from "./pages/SettingsPage";

/** Porteiro: nada da área restrita é renderizado sem sessão válida. */
const Gate = () => {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background p-8" role="status" aria-label="Carregando painel">
        <Skeleton className="mx-auto h-40 w-full max-w-sm" />
      </div>
    );
  }
  if (status === "needs-setup") return <LoginPage mode="setup" />;
  if (status === "signed-out") return <LoginPage mode="login" />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="cupons" element={<CouponsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

const AdminRoutes = () => (
  <AdminAuthProvider>
    <Gate />
  </AdminAuthProvider>
);

export default AdminRoutes;
