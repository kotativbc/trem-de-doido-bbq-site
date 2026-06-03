import { motion } from "framer-motion";
import { Heart, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import flyerAsset from "@/assets/namorados-flyer.jpg.asset.json";

const WHATSAPP_MESSAGE = `*🔥 RESERVA DIA DOS NAMORADOS - TREM DE DOIDO BBQ*
Olá! Gostaria de garantir minha mesa para o jantar de Dia dos Namorados. Estou ciente do valor do pacote (R$ 200,00) e da taxa de reserva (R$ 100,00). Como faço para transferir o sinal?`;

const whatsappUrl = `https://wa.me/5531997036657?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const ValentinesSection = () => {
  return (
    <section
      id="namorados"
      className="relative py-16 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0A0A0A 0%, #1a0509 50%, #0A0A0A 100%)",
      }}
      aria-labelledby="namorados-title"
    >
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_20%_30%,rgba(212,175,55,0.15),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.15),transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto rounded-2xl border border-[#D4AF37]/40 bg-black/40 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-6 md:p-8 flex items-center justify-center"
            >
              <img
                src={flyerAsset.url}
                alt="Cardápio especial Dia dos Namorados - Trem de Doido BBQ"
                className="w-full h-auto rounded-lg shadow-2xl ring-1 ring-[#D4AF37]/30"
                loading="lazy"
              />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 md:p-10 flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">
                  Edição Especial
                </span>
              </div>

              <h2
                id="namorados-title"
                className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight"
              >
                Especial Dia dos Namorados
                <Flame className="inline-block w-7 h-7 ml-2 text-primary" />
              </h2>

              <p className="mt-3 text-muted-foreground italic font-serif text-base md:text-lg">
                Celebre o amor com sabor, carinho e bons momentos.
              </p>

              <ul className="mt-6 space-y-3 text-sm md:text-base">
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold min-w-[110px]">Entrada:</span>
                  <span className="text-foreground">Tábua de frios</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold min-w-[110px]">Principal:</span>
                  <span className="text-foreground">Tábua de costela e costelinha barbecue</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold min-w-[110px]">Sobremesa:</span>
                  <span className="text-foreground">Petit gateau com sorvete de creme</span>
                </li>
              </ul>

              <div className="mt-6 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground text-sm">Pacote (Casal)</span>
                  <span className="font-serif text-2xl text-[#D4AF37] font-bold">R$ 200,00</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground text-sm">Taxa de Reserva (Sinal)</span>
                  <span className="font-serif text-xl text-[#D4AF37] font-semibold">R$ 100,00</span>
                </div>
                <p className="text-xs text-red-400 pt-2 border-t border-[#D4AF37]/20 mt-2">
                  ⚠️ Reservas limitadas! Válido apenas para reservas feitas até 10/06.
                </p>
              </div>

              <motion.div
                animate={{ scale: [1, 1.04, 1, 1.04, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="mt-6"
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-[#D4AF37] text-primary-foreground hover:opacity-90 text-base md:text-lg py-6 shadow-[0_0_30px_rgba(212,175,55,0.4)] focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Garantir minha reserva pelo WhatsApp"
                  >
                    <Heart className="w-5 h-5 mr-2 fill-current" />
                    Garantir Minha Reserva
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValentinesSection;