import type { Catalog, Category, Product } from "@/domain/types";

/**
 * Cardápio inicial (idêntico ao do site original). Preços em centavos.
 * O admin pode editar tudo; quando o restaurante ainda não editou nada, é isto que aparece.
 */

export const seedCategories: Category[] = [
  { id: "domingos", label: "🗓️ Domingos", sundayOnly: true, order: 0, active: true },
  { id: "hamburgueres", label: "🍔 Hambúrgueres", sundayOnly: false, order: 1, active: true },
  { id: "combos", label: "🤝 Combos", sundayOnly: false, order: 2, active: true },
  { id: "espetinhos", label: "🍢 Espetinhos", sundayOnly: false, order: 3, active: true },
  { id: "bbq", label: "🔥 American BBQ", sundayOnly: false, order: 4, active: true },
  { id: "acompanhamentos", label: "🥔 Acompanhamentos", sundayOnly: false, order: 5, active: true },
  { id: "bebidas", label: "🥤 Bebidas", sundayOnly: false, order: 6, active: true },
];

type SeedRow = [id: string, name: string, description: string, priceCents: number, categoryId: string, badge?: string];

const rows: SeedRow[] = [
  // DOMINGOS
  ["d1", "Arroz Carreteiro", "Arroz temperado com carnes defumadas e tempero da casa", 2500, "domingos"],
  ["d2", "Frango Defumado", "Frango inteiro defumado lentamente no Pit Smoker", 6000, "domingos"],
  ["d3", "Costelinha Barbecue", "Costelinha suína defumada com molho barbecue especial", 8000, "domingos"],
  ["d4", "Costela Bovina Defumada", "Costela bovina premium (Low & Slow) com rub exclusivo", 8000, "domingos"],
  // HAMBÚRGUERES
  ["h1", "Trem Vermelho", "Blend 160g, pão vermelho com pimenta, calabresa, pepperoni, bacon, queijo cheddar, alface americana, tomate, maionese de chimi limão, ketchup à parte", 3990, "hamburgueres"],
  ["h2", "Burger de Costela", "Pão de brioche, costela bovina desfiada 200g, queijo muçarela, rúcula, alface americana, tomate, cebola roxa, chimichurri", 4699, "hamburgueres"],
  ["h3", "Burger de Costelinha", "Pão australiano, costelinha barbecue desfiada 200g, rúcula, alface, tomate, geleia de pimenta", 4690, "hamburgueres"],
  ["h4", "Burger Trem de Doido Tradicional", "Pão de brioche, blend 160g, queijo muçarela, bacon, alface americana, tomate, chimichurri", 3590, "hamburgueres"],
  ["h5", "Big Trem de Doido Especial", "Pão de brioche, 2 carnes 160g, 3 fatias cheddar, 4 fatias bacon, alface, tomate, maionese Trem de Doido e ketchup", 5990, "hamburgueres"],
  ["h6", "Trem de Doido Kids", "Pão de brioche, burger 160g, queijo cheddar, maionese e ketchup", 2990, "hamburgueres"],
  ["h7", "Trem de Doido Especial", "Escolha de pão (vermelho, australiano ou tradicional), 1 carne 160g, 3 fatias cheddar, 4 fatias bacon, alface, tomate, maionese e ketchup Heinz", 3990, "hamburgueres"],
  ["h8", "Trem de Doido Brutus", "Costela desfiada com queijo muçarela, carne de hambúrguer 160g com queijo cheddar, rúcula, chimichurri e geleia de pimenta", 5990, "hamburgueres", "Novo"],
  // COMBOS
  ["c1", "Combo Família", "4 Burger Trem de Doido + 1 Refrigerante 2L", 14990, "combos"],
  ["c2", "Combo Casal", "2 Burger Trem de Doido Tradicional + 1 Refrigerante 600ml grátis", 6990, "combos"],
  ["c3", "Combo Infantil", "Burger 160g + queijo cheddar + maionese + ketchup + Batata Frita + 1 Refrigerante lata", 3690, "combos"],
  // ESPETINHOS
  ["e1", "Contra Filé", "Espetinho de contra filé na brasa", 1300, "espetinhos"],
  ["e2", "Medalhão de Frango com Bacon", "Espetinho de frango envolto em bacon", 1300, "espetinhos"],
  ["e3", "Coraçãozinho", "Espetinho de coração de frango", 1300, "espetinhos"],
  ["e4", "Porco", "Espetinho de carne suína temperada", 1300, "espetinhos"],
  // BBQ
  ["b1", "Beef Ribs", "700g costela bovina defumada + 300g batata rústica com molho grill", 11000, "bbq"],
  ["b2", "Pork Ribs", "700g costelinha suína defumada com barbecue + 300g batata rústica com molho grill", 9990, "bbq"],
  ["b3", "Pulled Pork", "600g copa lombo defumada + 300g batata rústica", 7000, "bbq"],
  ["b4", "Chicken Legs", "Coxa e sobrecoxa de frango defumada", 1500, "bbq"],
  ["b5", "Fraldinha Defumada", "Fraldinha Angus defumada, extremamente suculenta", 9000, "bbq", "Novo"],
  ["b6", "Frango Defumado", "Frango inteiro defumado no Pit Smoker", 6000, "bbq"],
  ["b7", "Tábua Mista", "400g costela bovina defumada + 400g costelinha barbecue + 300g batata rústica", 14000, "bbq", "Novo"],
  // ACOMPANHAMENTOS
  ["a1", "Batata Rústica 300g", "Batata rústica na brasa com molho grill", 1500, "acompanhamentos"],
  ["a2", "Batata Rústica 500g", "Batata rústica na brasa porção grande", 2000, "acompanhamentos"],
  // BEBIDAS
  ["be1", "Coca-Cola 2 Litros", "", 1600, "bebidas"],
  ["be2", "Coca-Cola 600ml", "", 800, "bebidas"],
  ["be3", "Coca-Cola Lata", "", 600, "bebidas"],
  ["be6", "Suco Del Valle 1L", "", 1200, "bebidas"],
  ["be4", "Cerveja Original", "", 800, "bebidas"],
  ["be5", "Heineken", "", 1000, "bebidas"],
];

/** Produtos novos que ainda não têm foto no projeto (o editor permite enviar uma). */
const semImagem = new Set(["be6"]);

const orderInCategory = new Map<string, number>();

export const seedProducts: Product[] = rows.map(([id, name, description, priceCents, categoryId, badge]) => {
  const order = orderInCategory.get(categoryId) ?? 0;
  orderInCategory.set(categoryId, order + 1);
  return {
    id,
    name,
    description,
    priceCents,
    categoryId,
    badge,
    // As imagens que já existem no projeto são chaveadas pelo id do produto.
    imageKey: semImagem.has(id) ? undefined : id,
    active: true,
    soldOut: false,
    sundayOnly: categoryId === "domingos",
    featured: false,
    order,
    addonGroups: [],
  };
});

export const seedCatalog: Catalog = { categories: seedCategories, products: seedProducts };
