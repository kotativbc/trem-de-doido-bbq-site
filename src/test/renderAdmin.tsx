import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoutes from "@/admin/AdminRoutes";
import LocationProbe from "./LocationProbe";

/** Monta o painel numa rota (ex.: "/admin/pedidos") com providers novos e isolados. */
export const renderAdmin = (path = "/admin") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<div>site público</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};
