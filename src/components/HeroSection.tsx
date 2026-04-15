import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bbq.jpg";

const SmokeButton = ({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className="relative inline-flex items-center justify-center">
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-md bg-primary"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
      <Button
        onClick={onClick}
        size="lg"
        className={className}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </Button>
    </div>
  );
};

// ... keep existing code

         className="text-5xl md:text-7xl lg:text-8xl font-['Bebas_Neue'] text-foreground leading-none"
        >
          O VERDADEIRO <span className="text-primary">AMERICAN BBQ</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-4xl font-['Bebas_Neue'] text-foreground mt-2"
        >
          COM O TEMPERO DE MINAS
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mt-4 text-sm md:text-base max-w-md"
        >
          Comandado pelo Chef Edmundo Leitão em Sarzedo/MG
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center"
        >
          <SmokeButton
            onClick={() => scrollTo("cardapio")}
            className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 animate-pulse-flame"
          >
            Faça seu Pedido
          </SmokeButton>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-6"
          >
            <ChevronDown className="text-muted-foreground" size={28} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
