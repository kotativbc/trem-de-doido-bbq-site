import type { Cents } from "./money";

/** Horário de um dia da semana. `from` e `to` no formato "HH:mm". */
export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export interface MinuteRange {
  min: number;
  max: number;
}

export interface DeliveryZone {
  id: string;
  /** Bairro ou faixa (ex.: "Centro", "Até 3 km"). */
  name: string;
  feeCents: Cents;
}

export interface DeliverySettings {
  enabled: boolean;
  /** Taxa usada quando o bairro informado não está em nenhuma zona. */
  defaultFeeCents: Cents;
  zones: DeliveryZone[];
  /** 0 = sem pedido mínimo. */
  minOrderCents: Cents;
  serviceAreaText: string;
  prepMinutes: MinuteRange;
  deliveryMinutes: MinuteRange;
}

export interface OrderingSettings {
  /** Quando ligado, itens "somente aos domingos" não podem ser pedidos nos outros dias. */
  enforceSundayOnly: boolean;
  /** Quando desligado, o envio do pedido fica bloqueado com a loja fechada. */
  allowOrdersWhenClosed: boolean;
}

export interface PromoBanner {
  enabled: boolean;
  text: string;
}

export interface BusinessSettings {
  name: string;
  city: string;
  /** "Av. João Pinheiro, 107" */
  addressLine: string;
  /** "Av. João Pinheiro, 107 - Sarzedo/MG" (texto exibido) */
  addressFull: string;
  /** Texto usado para abrir a rota no Google Maps. */
  mapsQuery: string;
  /** "(31) 99703-6657" */
  phoneDisplay: string;
  /** Somente dígitos com DDI: "5531997036657". */
  whatsappNumber: string;
  /** Sem o "@". */
  instagramHandle: string;
  timezone: string;
  /** 7 posições, índice = Date#getDay() (0 = domingo). */
  hours: DayHours[];
  /** Datas fechadas extraordinariamente, "YYYY-MM-DD". */
  closedDates: string[];
  delivery: DeliverySettings;
  ordering: OrderingSettings;
  promoBanner: PromoBanner;
}
