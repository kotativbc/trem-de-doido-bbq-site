import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import pitmasterImg from "@/assets/pitmaster.jpg";

const PitmasterSection = () => (
  <section className="py-20 bg-[#0A0A0A] overflow-x-clip">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-xl overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.15)]">
            <img
              src={pitmasterImg}
              alt="Pitmaster Edmundo Leitão"
              className="w-full object-cover aspect-square grayscale contrast-125"
              loading="lazy"
              width={800}
              height={800}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[#F97316]" />
            <span className="text-[#F97316] text-sm font-semibold tracking-widest uppercase">
              O Pitmaster
            </span>
          </div>

          <h2 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white leading-none">
            EDMUNDO LEITÃO
          </h2>

          <div className="space-y-4">
            <p className="text-[#A3A3A3] leading-relaxed">
              Com anos de experiência na arte do fogo e da fumaça, o Chef Edmundo Leitão comanda o pit com maestria.
              Especialista em American BBQ, Edmundo une a técnica da defumação lenta (Low &amp; Slow) com o sabor
              inconfundível de Minas Gerais.
            </p>
            <p className="text-[#A3A3A3] leading-relaxed">
              Cada corte que sai da Trem de Doido BBQ passa pelo seu olhar criterioso,
              garantindo que a carne chegue à sua mesa com o{" "}
              <span className="text-[#F97316] font-semibold">"smoke ring"</span>{" "}
              perfeito e uma suculência sem igual.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="font-['Bebas_Neue'] text-2xl text-[#F97316]">LOW</p>
              <p className="text-xs text-[#737373] tracking-wider">& SLOW</p>
            </div>
            <div className="border-l border-[#262626] h-10" />
            <div className="text-center">
              <p className="font-['Bebas_Neue'] text-2xl text-[#F97316]">100%</p>
              <p className="text-xs text-[#737373] tracking-wider">ARTESANAL</p>
            </div>
            <div className="border-l border-[#262626] h-10" />
            <div className="text-center">
              <p className="font-['Bebas_Neue'] text-2xl text-[#F97316]">MG</p>
              <p className="text-xs text-[#737373] tracking-wider">SARZEDO</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PitmasterSection;
