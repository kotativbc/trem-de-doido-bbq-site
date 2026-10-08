import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppBlockedNoticeProps {
  whatsappUrl: string;
  onContinue: () => void;
  onBack: () => void;
}

/** O navegador bloqueou a janela do WhatsApp: o pedido NÃO foi enviado e a sacola continua intacta até o cliente abrir o link. */
const WhatsAppBlockedNotice = ({ whatsappUrl, onContinue, onBack }: WhatsAppBlockedNoticeProps) => (
  <div className="flex flex-col flex-1 min-h-0 px-5 py-6 gap-4" role="alert">
    <h4 className="font-['Bebas_Neue'] text-2xl text-[#E5E5E5] tracking-wide">O WHATSAPP NÃO ABRIU</h4>
    <p className="text-sm text-[#AAA]">
      Seu navegador bloqueou a janela. Seu pedido ainda <strong className="text-[#E5E5E5]">não foi enviado</strong> ao
      restaurante. Toque no botão abaixo para abrir o WhatsApp e enviar a mensagem.
    </p>
    <Button asChild className="w-full bg-[#9A3412] hover:bg-[#7C2D12] text-[#E5E5E5] font-bold py-6 gap-2 focus-visible:ring-2 focus-visible:ring-primary">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={onContinue}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Abrir WhatsApp
      </a>
    </Button>
    <Button type="button" variant="ghost" className="w-full text-[#888] hover:text-[#E5E5E5] text-sm" onClick={onBack}>
      ← Voltar ao pedido
    </Button>
  </div>
);

export default WhatsAppBlockedNotice;
