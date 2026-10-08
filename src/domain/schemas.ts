import { z } from "zod";

/**
 * Schemas Zod dos modelos persistidos. Tudo que é lido do navegador (ou, no futuro,
 * de uma API) passa por aqui antes de virar dado confiável.
 */

const cents = z.number().int().min(0);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm");

export const cartLineSchema = z.object({
  lineId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  addonOptionIds: z.array(z.string()),
  note: z.string().max(200),
});

export const addonOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  priceCents: cents,
});

export const addonGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  maxSelect: z.number().int().min(1).max(20),
  required: z.boolean(),
  options: z.array(addonOptionSchema),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(60),
  sundayOnly: z.boolean(),
  order: z.number().int(),
  active: z.boolean(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(400),
  priceCents: cents,
  categoryId: z.string().min(1),
  badge: z.string().max(20).optional(),
  imageKey: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean(),
  soldOut: z.boolean(),
  sundayOnly: z.boolean(),
  featured: z.boolean(),
  order: z.number().int(),
  addonGroups: z.array(addonGroupSchema),
});

export const catalogSchema = z.object({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
});

export const dayHoursSchema = z.object({ open: z.boolean(), from: hhmm, to: hhmm });
const minuteRange = z.object({ min: z.number().int().min(0), max: z.number().int().min(0) });

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  addressLine: z.string().trim().min(1).max(120),
  addressFull: z.string().trim().min(1).max(160),
  mapsQuery: z.string().trim().min(1).max(200),
  phoneDisplay: z.string().trim().min(1).max(30),
  whatsappNumber: z.string().regex(/^\d{12,13}$/, "Use DDI + DDD + número, só dígitos (ex.: 5531997036657)"),
  instagramHandle: z.string().trim().min(1).max(40),
  timezone: z.string().min(1),
  hours: z.array(dayHoursSchema).length(7),
  closedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  delivery: z.object({
    enabled: z.boolean(),
    defaultFeeCents: cents,
    zones: z.array(z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(60), feeCents: cents })),
    minOrderCents: cents,
    serviceAreaText: z.string().max(300),
    prepMinutes: minuteRange,
    deliveryMinutes: minuteRange,
  }),
  ordering: z.object({ enforceSundayOnly: z.boolean(), allowOrdersWhenClosed: z.boolean() }),
  promoBanner: z.object({ enabled: z.boolean(), text: z.string().max(200) }),
});
