export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  badge?: string;
}

export const categories = [
  { id: "domingos", label: "🗓️ Domingos", icon: "clock" },
  { id: "hamburgueres", label: "🍔 Hambúrgueres", icon: "beef" },
  { id: "combos", label: "🤝 Combos", icon: "package" },
  { id: "espetinhos", label: "🍢 Espetinhos", icon: "flame" },
  { id: "bbq", label: "🔥 American BBQ", icon: "flame" },
  { id: "acompanhamentos", label: "🥔 Acompanhamentos", icon: "salad" },
  { id: "bebidas", label: "🥤 Bebidas", icon: "cup-soda" },
];

export const menuItems: MenuItem[] = [
  // DOMINGOS
  { id: "d1", name: "Arroz Carreteiro", description: "Arroz temperado com carnes defumadas e tempero da casa", price: 25, category: "domingos" },
  { id: "d2", name: "Frango Defumado", description: "Frango inteiro defumado lentamente no Pit Smoker", price: 60, category: "domingos" },
  { id: "d3", name: "Costelinha Barbecue", description: "Costelinha suína defumada com molho barbecue especial", price: 80, category: "domingos" },
  { id: "d4", name: "Costela Bovina Defumada", description: "Costela bovina premium (Low & Slow) com rub exclusivo", price: 80, category: "domingos" },
  // HAMBÚRGUERES
  { id: "h1", name: "Trem Vermelho", description: "Blend 160g, pão vermelho com pimenta, calabresa, pepperoni, bacon, queijo cheddar, alface americana, tomate, maionese de chimi limão, ketchup à parte", price: 36.9, category: "hamburgueres" },
  { id: "h2", name: "Burger de Costela", description: "Pão de brioche, costela bovina desfiada 200g, queijo muçarela, rúcula, alface americana, tomate, cebola roxa, chimichurri", price: 39.99, category: "hamburgueres" },
  { id: "h3", name: "Burger de Costelinha", description: "Pão australiano, costelinha barbecue desfiada 200g, rúcula, alface, tomate, geleia de pimenta", price: 39.9, category: "hamburgueres" },
  { id: "h4", name: "Burger Trem de Doido Tradicional", description: "Pão de brioche, blend 160g, queijo muçarela, bacon, alface americana, tomate, chimichurri", price: 35.9, category: "hamburgueres" },
  { id: "h5", name: "Big Trem de Doido Especial", description: "Pão de brioche, 2 carnes 160g, 3 fatias cheddar, 4 fatias bacon, alface, tomate, maionese Trem de Doido", price: 49.9, category: "hamburgueres" },
  { id: "h6", name: "Trem de Doido Kids", description: "Pão de brioche, burger 160g, queijo cheddar, maionese e ketchup", price: 29.9, category: "hamburgueres" },
  { id: "h7", name: "Trem de Doido Especial", description: "Escolha de pão (vermelho, australiano ou tradicional), 1 carne 160g, 3 fatias cheddar, 4 fatias bacon, alface, tomate, maionese e ketchup Heinz", price: 39.9, category: "hamburgueres" },
  { id: "h8", name: "Trem de Doido Brutus", description: "Carne de 160g, Queijo cheddar, Costela bovina desfiada (160g), Queijo muçarela, Rúcula, Tomate e Alface americana.", price: 49.9, category: "hamburgueres", badge: "Novo" },
  // COMBOS
  { id: "c1", name: "Combo Família", description: "4 Burger Trem de Doido + 1 Refrigerante 2L", price: 149.9, category: "combos" },
  { id: "c2", name: "Combo Casal", description: "2 Burger Trem de Doido Tradicional + 1 Refrigerante 600ml grátis", price: 64.9, category: "combos" },
  { id: "c3", name: "Combo Infantil", description: "Burger 160g + queijo cheddar + maionese + ketchup + Batata Frita + 1 Refrigerante lata", price: 36.9, category: "combos" },
  // ESPETINHOS
  { id: "e1", name: "Contra Filé", description: "Espetinho de contra filé na brasa", price: 12, category: "espetinhos" },
  { id: "e2", name: "Medalhão de Frango com Bacon", description: "Espetinho de frango envolto em bacon", price: 12, category: "espetinhos" },
  { id: "e3", name: "Coraçãozinho", description: "Espetinho de coração de frango", price: 12, category: "espetinhos" },
  { id: "e4", name: "Porco", description: "Espetinho de carne suína temperada", price: 12, category: "espetinhos" },
  // BBQ
  { id: "b1", name: "Beef Ribs", description: "600g costela bovina defumada + 300g batata rústica", price: 80, category: "bbq" },
  { id: "b2", name: "Pork Ribs", description: "600g costelinha suína defumada com BBQ + 300g batata rústica", price: 80, category: "bbq" },
  { id: "b3", name: "Pulled Pork", description: "600g copa lombo defumada + 300g batata rústica", price: 70, category: "bbq" },
  { id: "b4", name: "Chicken Legs", description: "Coxa e sobrecoxa de frango defumada", price: 15, category: "bbq" },
  { id: "b5", name: "Fraldinha Defumada", description: "Fraldinha Angus defumada, extremamente suculenta", price: 90, category: "bbq", badge: "Novo" },
  { id: "b6", name: "Frango Defumado", description: "Frango inteiro defumado no Pit Smoker", price: 60, category: "bbq" },
  { id: "b7", name: "Tábua Mista", description: "Seleção dos melhores cortes do dia (Bovino, Suíno e Acompanhamentos)", price: 100, category: "bbq", badge: "Novo" },
  // ACOMPANHAMENTOS
  { id: "a1", name: "Batata Rústica 300g", description: "Batata rústica na brasa com molho grill", price: 15, category: "acompanhamentos" },
  { id: "a2", name: "Batata Rústica 500g", description: "Batata rústica na brasa porção grande", price: 20, category: "acompanhamentos" },
  // BEBIDAS
  { id: "be1", name: "Coca-Cola 2 Litros", description: "", price: 16, category: "bebidas" },
  { id: "be2", name: "Coca-Cola 600ml", description: "", price: 8, category: "bebidas" },
  { id: "be3", name: "Coca-Cola Lata", description: "", price: 6, category: "bebidas" },
  { id: "be4", name: "Cerveja Original", description: "", price: 8, category: "bebidas" },
  { id: "be5", name: "Heineken", description: "", price: 10, category: "bebidas" },
];
