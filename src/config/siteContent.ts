/**
 * Textos institucionais da página pública (iguais aos do site original).
 * Dados de contato e horários NÃO ficam aqui: vêm de `business.ts`.
 */

export const siteContent = {
  menu: {
    /** Aba aberta ao carregar a página (igual ao site original). */
    defaultCategoryId: "hamburgueres",
  },
  hero: {
    imageAlt: "BBQ defumado no estilo American Barbecue",
    titlePrefix: "O VERDADEIRO",
    titleHighlight: "AMERICAN BBQ",
    subtitle: "COM O TEMPERO DE MINAS",
    // O restante da linha ("em Sarzedo/MG") vem de business.city.
    byline: "Comandado pelo Chef Edmundo Leitão",
    cta: "Faça seu Pedido",
  },
  socialProof: {
    ratingLabel: "5.0 no Google",
    stars: 5,
    reviews: [
      { text: "Melhor smash burger de Sarzedo! O Big Trem de Doido é incrível.", author: "Carlos M." },
      { text: "Beef Ribs perfeito, defumado do jeito certo. Volta e meia estou aqui!", author: "Ana P." },
      { text: "Atendimento top, comida chegou quente e deliciosa. 10/10!", author: "Rafael S." },
    ],
  },
  pitmaster: {
    eyebrow: "O Pitmaster",
    name: "EDMUNDO LEITÃO",
    imageAlt: "Pitmaster Edmundo Leitão",
    paragraphs: [
      "Com anos de experiência na arte do fogo e da fumaça, o Chef Edmundo Leitão comanda o pit com maestria. Especialista em American BBQ, Edmundo une a técnica da defumação lenta (Low & Slow) com o sabor inconfundível de Minas Gerais.",
    ],
    secondParagraph: {
      before: "Cada corte que sai da Trem de Doido BBQ passa pelo seu olhar criterioso, garantindo que a carne chegue à sua mesa com o ",
      highlight: '"smoke ring"',
      after: " perfeito e uma suculência sem igual.",
    },
    stats: [
      { value: "LOW", label: "& SLOW" },
      { value: "100%", label: "ARTESANAL" },
      { value: "MG", label: "SARZEDO" },
    ],
  },
  footer: {
    developer: {
      name: "KotaTI",
      whatsappNumber: "5531933046961",
      message: "Olá, Gostaria de mais informações sobre Cardapio Digital",
    },
  },
} as const;
