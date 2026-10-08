import { z } from "zod";
import { isValidCep } from "./cep";
import { formatBRL, parseBRLToCents, type Cents } from "./money";
import { isValidPhoneBR } from "./phone";

export const NAME_MAX = 80;
export const ADDRESS_MAX = 200;
export const NOTES_MAX = 500;
export const SHORT_FIELD_MAX = 80;

export const fulfillmentOptions = [
  { value: "entrega", label: "Entrega" },
  { value: "retirada", label: "Retirar no Balcão" },
] as const;

export const paymentOptions = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
] as const;

export const paymentLabel: Record<"pix" | "cartao" | "dinheiro", string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

/**
 * Regra ÚNICA de validação do checkout (antes havia duas versões divergentes).
 * Troco: opcional. Se preenchido, precisa ser um valor monetário válido e cobrir o total.
 */
export const createCheckoutSchema = (ctx: { totalCents: Cents }) =>
  z
    .object({
      name: z.string().trim().min(1, "Informe seu nome.").max(NAME_MAX, `Use até ${NAME_MAX} caracteres.`),
      phone: z
        .string()
        .trim()
        .min(1, "Informe seu telefone com DDD.")
        .refine(isValidPhoneBR, "Telefone inválido. Use DDD + número, por exemplo (31) 99999-9999."),
      fulfillment: z.enum(["entrega", "retirada"]),
      address: z.string().trim().max(ADDRESS_MAX, `Use até ${ADDRESS_MAX} caracteres.`),
      neighborhood: z.string().trim().max(SHORT_FIELD_MAX, `Use até ${SHORT_FIELD_MAX} caracteres.`),
      /** Opcional; se preenchido precisa ter 8 dígitos. */
      cep: z.string().trim(),
      complement: z.string().trim().max(SHORT_FIELD_MAX, `Use até ${SHORT_FIELD_MAX} caracteres.`),
      reference: z.string().trim().max(ADDRESS_MAX, `Use até ${ADDRESS_MAX} caracteres.`),
      /** Link do mapa gerado pelo botão "Usar minha localização"; opcional. */
      locationUrl: z.string().trim().max(200),
      payment: z.enum(["pix", "cartao", "dinheiro"]),
      changeFor: z.string().trim(),
      notes: z.string().trim().max(NOTES_MAX, `Use até ${NOTES_MAX} caracteres.`),
    })
    .superRefine((values, issue) => {
      if (values.fulfillment === "entrega") {
        if (values.address === "") {
          issue.addIssue({ code: "custom", path: ["address"], message: "Informe o endereço de entrega." });
        }
        if (values.neighborhood === "") {
          issue.addIssue({ code: "custom", path: ["neighborhood"], message: "Informe o bairro." });
        }
        if (values.cep !== "" && !isValidCep(values.cep)) {
          issue.addIssue({ code: "custom", path: ["cep"], message: "CEP inválido. Use 8 dígitos, por exemplo 32450-000." });
        }
      }

      if (values.payment === "dinheiro" && values.changeFor !== "") {
        const cents = parseBRLToCents(values.changeFor);
        if (cents === null || cents <= 0) {
          issue.addIssue({ code: "custom", path: ["changeFor"], message: "Informe um valor válido, por exemplo 100,00." });
        } else if (cents < ctx.totalCents) {
          issue.addIssue({
            code: "custom",
            path: ["changeFor"],
            message: `O valor para troco precisa cobrir o total (${formatBRL(ctx.totalCents)}).`,
          });
        }
      }
    });

export type CheckoutValues = z.infer<ReturnType<typeof createCheckoutSchema>>;

export const emptyCheckoutValues: CheckoutValues = {
  name: "",
  phone: "",
  fulfillment: "entrega",
  address: "",
  neighborhood: "",
  cep: "",
  complement: "",
  reference: "",
  locationUrl: "",
  payment: "pix",
  changeFor: "",
  notes: "",
};
