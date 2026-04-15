import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bbq.jpg";

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={ref} className="relative h-screen min-h-[600px] overflow-hidden pt-16">
      <motion.div style={{ y }} className="absolute inset-0">
        <img src={heroBg} alt="BBQ defumado" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </motion.div>

      <div className="relative z-10 container mx-auto flex flex-col items-center justify-center h-full text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-['Bebas_Neue'] text-foreground leading-none"
        >
          O VERDADEIRO AMERICAN BBQ
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-4xl font-['Bebas_Neue'] text-primary mt-2"
        >
          Com o Tempero de Minas
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mt-4 text-sm md:text-base max-w-md"
        >
          Comandado pelo Pitmaster Edmundo Leitão em Sarzedo/MG
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={() => scrollTo("cardapio")}
            size="lg"
            className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 animate-pulse-flame"
          >
            Faça seu Pedido
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
