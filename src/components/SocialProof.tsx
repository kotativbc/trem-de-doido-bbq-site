import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
  { text: "Melhor smash burger de Sarzedo! O Big Trem de Doido é incrível.", author: "Carlos M." },
  { text: "Beef Ribs perfeito, defumado do jeito certo. Volta e meia estou aqui!", author: "Ana P." },
  { text: "Atendimento top, comida chegou quente e deliciosa. 10/10!", author: "Rafael S." },
];

const SocialProof = () => (
  <section className="py-16 bg-surface-dark">
    <div className="container mx-auto px-4 text-center">
      <div className="flex items-center justify-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-6 w-6 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-foreground font-bold text-lg mb-8">5.0 no Google</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <Card className="bg-card border-border h-full">
              <CardContent className="p-6">
                <p className="text-foreground italic mb-4">"{r.text}"</p>
                <p className="text-primary font-semibold text-sm">— {r.author}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
