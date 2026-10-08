import type { BusinessSettings, DayHours } from "@/domain/settings";

/**
 * ÚNICA fonte dos dados de contato e operação do restaurante.
 * Estes são os valores iniciais; o admin pode sobrescrevê-los (ver SettingsRepository).
 * Nada disto deve ser repetido em componentes.
 */

const closedDay: DayHours = { open: false, from: "18:00", to: "23:00" };
const openDay: DayHours = { open: true, from: "18:00", to: "23:00" };

export const defaultBusinessSettings: BusinessSettings = {
  name: "Trem de Doido BBQ",
  city: "Sarzedo/MG",
  addressLine: "Av. João Pinheiro, 107",
  addressFull: "Av. João Pinheiro, 107 - Sarzedo/MG",
  mapsQuery: "Trem de Doido Barbecue, Av. João Pinheiro, 107, Sarzedo, MG",
  phoneDisplay: "(31) 99703-6657",
  whatsappNumber: "5531997036657",
  instagramHandle: "tremdedoidobbq",
  timezone: "America/Sao_Paulo",
  // índice = getDay(): domingo ... sábado. Quarta a domingo, 18:00-23:00; fechado seg/ter.
  hours: [openDay, closedDay, closedDay, openDay, openDay, openDay, openDay],
  closedDates: [],
  delivery: {
    enabled: true,
    // A CONFIGURAR pelo restaurante: sem taxa até que as faixas por bairro sejam definidas.
    defaultFeeCents: 0,
    zones: [],
    // A CONFIGURAR: 0 = sem pedido mínimo.
    minOrderCents: 0,
    serviceAreaText: "",
    // ESTIMATIVA inicial, ajustável no admin.
    prepMinutes: { min: 30, max: 40 },
    deliveryMinutes: { min: 10, max: 20 },
  },
  ordering: {
    // Preserva o comportamento atual do site: itens de domingo podem ser pedidos em qualquer dia.
    enforceSundayOnly: false,
    allowOrdersWhenClosed: false,
  },
  promoBanner: { enabled: false, text: "" },
};

export const instagramUrl = (handle: string): string => `https://instagram.com/${handle}`;

export const whatsappChatUrl = (whatsappNumber: string, text?: string): string =>
  text ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}` : `https://wa.me/${whatsappNumber}`;

export const telUrl = (whatsappNumber: string): string => `tel:+${whatsappNumber}`;

export const mapsDirectionsUrl = (query: string): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

/** Embed do Google Maps exatamente como no site original. */
export const mapEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.8!2d-44.1346707!3d-20.0453441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6c70ea0bf6bb5%3A0x4ddb7497a92a1beb!2sTrem%20de%20Doido%20Barbecue!5e0!3m2!1spt-BR!2sbr!4v1";
