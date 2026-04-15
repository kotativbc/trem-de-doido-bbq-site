import { motion } from "framer-motion";
import pitmasterImg from "@/assets/pitmaster.jpg";

const PitmasterSection = () => (
  <section className="py-20 bg-surface-dark">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={pitmasterImg}
            alt="Pitmaster Edmundo Leitão"
            className="rounded-lg w-full object-cover aspect-square"
            loading="lazy"
            width={800}
            height={1000}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-foreground mb-2">O PITMASTER</h2>
          <p className="text-primary font-['Bebas_Neue'] text-2xl mb-6">Edmundo Leitão — Mestre da Fumaça</p>
          <p className="text-muted-foreground leading-relaxed">
            Com anos de experiência na arte do fogo e da fumaça, o Chef Edmundo Leitão comanda o pit com maestria.
            Especialista em American BBQ, Edmundo une a técnica da defumação lenta (Low & Slow) com o sabor
            inconfundível de Minas Gerais. Cada corte que sai da Trem de Doido BBQ passa pelo seu olhar criterioso,
            garantindo que a carne chegue à sua mesa com o "smoke ring" perfeito e uma suculência sem igual.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PitmasterSection;
