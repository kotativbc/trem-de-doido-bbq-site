import type { ReactNode } from "react";
import { formatBRL, type Cents } from "@/domain/money";

interface DrawerFooterProps {
  totalCents: Cents;
  children: ReactNode;
}

/** Rodapé fixo do drawer: total do pedido + ações. */
const DrawerFooter = ({ totalCents, children }: DrawerFooterProps) => (
  <div
    className="shrink-0 border-t border-[#2A2A2A] bg-[#121212] px-5 pt-4"
    style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
  >
    <div className="flex justify-between items-center mb-3">
      <span className="text-[#E5E5E5] font-bold text-sm">Total do Pedido</span>
      <span className="text-primary font-bold text-xl">{formatBRL(totalCents)}</span>
    </div>
    {children}
  </div>
);

export default DrawerFooter;
