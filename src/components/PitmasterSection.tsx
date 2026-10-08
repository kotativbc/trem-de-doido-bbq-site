import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import pitmasterImg from "@/assets/pitmaster.jpg";
import { siteContent } from "@/config/siteContent";

const { pitmaster } = siteContent;

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
              alt={pitmaster.imageAlt}
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
              {pitmaster.eyebrow}
            </span>
          </div>

          <h2 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white leading-none">
            {pitmaster.name}
          </h2>

          <div className="space-y-4">
            <p className="text-[#A3A3A3] leading-relaxed">{pitmaster.paragraphs[0]}</p>
            <p className="text-[#A3A3A3] leading-relaxed">
              {pitmaster.secondParagraph.before}
              <span className="text-[#F97316] font-semibold">{pitmaster.secondParagraph.highlight}</span>
              {pitmaster.secondParagraph.after}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4">
            {pitmaster.stats.map((stat, i) => (
              <div key={stat.value} className="flex items-center gap-6">
                {i > 0 && <div className="border-l border-[#262626] h-10" />}
                <div className="text-center">
                  <p className="font-['Bebas_Neue'] text-2xl text-[#F97316]">{stat.value}</p>
                  <p className="text-xs text-[#737373] tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PitmasterSection;
