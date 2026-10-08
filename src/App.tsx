import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ErrorBoundary from "@/components/ErrorBoundary";

// O painel e suas dependências só são baixados por quem abre /admin.
const AdminRoutes = lazy(() => import("./admin/AdminRoutes.tsx"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation.tsx"));

const PageFallback = () => <div role="status" aria-label="Carregando" className="min-h-screen bg-background" />;

/** Cada rota tem sua própria barreira de erro: sair da página com defeito já a recupera. */
const RoutedErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary resetKey={useLocation().pathname}>{children}</ErrorBoundary>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* "user": quem pede menos movimento no sistema não vê parallax nem animações de entrada. */}
      <MotionConfig reducedMotion="user">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoutedErrorBoundary>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/pedido/:id"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <OrderConfirmation />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <AdminRoutes />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </RoutedErrorBoundary>
        </BrowserRouter>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
