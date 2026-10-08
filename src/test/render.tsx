import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CartDrawer from "@/components/cart/CartDrawer";
import MenuSection from "@/components/MenuSection";
import MobileCartBar from "@/components/MobileCartBar";
import StickyHeader from "@/components/StickyHeader";
import { CartProvider } from "@/context/CartContext";

/** Monta a loja (cabeçalho, cardápio, barra e drawer da sacola) com providers novos e isolados. */
export const renderStore = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CartProvider>
        <StickyHeader />
        <MenuSection />
        <MobileCartBar />
        <CartDrawer />
      </CartProvider>
    </QueryClientProvider>,
  );
};
