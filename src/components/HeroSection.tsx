import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bbq.jpg";
import { siteContent } from "@/config/siteContent";
import { useSettings } from "@/hooks/useSettings";
import { scrollToId as scrollTo } from "@/lib/scroll";

export const SmokeButton = ({ onClick, children, className = "" }: { onClick?: () => void; children: React.ReactNode; className?: string }) => {
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
        className={`focus-visible:ring-2 focus-visible:ring-primary ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </Button>
    </div>
  );
};

const HeroSection = () => {
  const settings = useSettings();
  const { hero } = siteContent;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section ref={ref} className="relative h-screen min-h-[600px] overflow-hidden pt-16">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={heroBg}
          alt={hero.imageAlt}
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </motion.div>

      <div className="relative z-10 container mx-auto flex flex-col items-center justify-center h-full text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-['Bebas_Neue'] text-foreground leading-none"
        >
          {hero.titlePrefix} <span className="text-primary">{hero.titleHighlight}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-4xl font-['Bebas_Neue'] text-foreground mt-2"
        >
          {hero.subtitle}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mt-4 text-sm md:text-base max-w-md"
        >
          {hero.byline} em {settings.city}
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
            {hero.cta}
          </SmokeButton>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-6"
            aria-hidden="true"
          >
            <ChevronDown className="text-muted-foreground" size={28} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
