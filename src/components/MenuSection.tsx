import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { categories, menuItems, type MenuItem } from "@/data/menuData";

const MenuCard = ({ item }: { item: MenuItem }) => {
  const { items, addItem, removeItem } = useCart();
  const qty = items.find((i) => i.id === item.id)?.qty || 0;
  const isSunday = item.category === "domingos";
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`bg-card rounded-lg border ${isSunday ? "border-sunday" : "border-border"} p-4 flex flex-col justify-between hover:border-primary/50 transition-colors`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-['Bebas_Neue'] text-lg text-foreground tracking-wide">{item.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {isSunday && <Badge variant="outline" className="border-sunday text-sunday text-xs">Especial</Badge>}
            {item.badge && <Badge className="bg-green-600 text-primary-foreground text-xs">{item.badge}</Badge>}
          </div>
        </div>
        {item.description && (
          <p
            className={`text-muted-foreground text-sm mt-1 ${!expanded ? "line-clamp-2 md:line-clamp-none" : ""}`}
            onClick={() => setExpanded(!expanded)}
          >
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <Badge className="bg-primary text-primary-foreground font-bold text-sm px-3">
          R$ {item.price.toFixed(2).replace(".", ",")}
        </Badge>
        <div className="flex items-center gap-2">
          {qty > 0 && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-border text-foreground"
                onClick={() => removeItem(item.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-foreground font-bold w-6 text-center">{qty}</span>
            </>
          )}
          <motion.div whileTap={{ scale: 1.2 }}>
            <Button
              size="icon"
              className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => addItem({ id: item.id, name: item.name, price: item.price, category: item.category })}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const MenuSection = () => {
  const [activeCategory, setActiveCategory] = useState("hamburgueres");
  const tabsRef = useRef<HTMLDivElement>(null);
  const filtered = menuItems.filter((i) => i.category === activeCategory);

  return (
    <section id="cardapio" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-foreground text-center mb-8">CARDÁPIO</h2>

        <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none sticky top-16 bg-background/95 backdrop-blur-md z-30 py-3 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory === "domingos" && (
          <div className="flex items-center gap-2 mb-4 text-sunday">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Disponível somente aos domingos</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
