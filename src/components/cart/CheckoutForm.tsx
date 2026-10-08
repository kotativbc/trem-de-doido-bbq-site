import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  createCheckoutSchema,
  emptyCheckoutValues,
  fulfillmentOptions,
  paymentOptions,
  type CheckoutValues,
} from "@/domain/checkout";
import { formatBRL } from "@/domain/money";
import type { BusinessSettings } from "@/domain/settings";
import type { PricedCart } from "@/domain/types";
import { buildOrderMessage, buildWhatsAppUrl } from "@/domain/whatsapp";
import DrawerFooter from "./DrawerFooter";

const inputClasses = "bg-[#1C1C1C] border-[#2A2A2A] text-[#E5E5E5] placeholder:text-[#666] rounded-lg focus-visible:ring-primary";
const labelClasses = "text-[#E5E5E5] text-xs font-semibold uppercase tracking-wide";

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="text-xs text-red-400" role="alert">
      {message}
    </p>
  ) : null;

interface CheckoutFormProps {
  priced: PricedCart;
  settings: BusinessSettings;
  onBack: () => void;
  onAddMore: () => void;
  /** Chamado depois que o WhatsApp foi aberto com a mensagem do pedido. */
  onSent: () => void;
}

const CheckoutForm = ({ priced, settings, onBack, onAddMore, onSent }: CheckoutFormProps) => {
  const schema = useMemo(() => createCheckoutSchema({ totalCents: priced.totalCents }), [priced.totalCents]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyCheckoutValues,
    mode: "onTouched",
  });

  const fulfillment = watch("fulfillment");
  const payment = watch("payment");
  const isPickup = fulfillment === "retirada";
  const hasBlockedLines = priced.lines.some((l) => l.unavailableReason);
  const canSubmit = isValid && priced.subtotalCents > 0 && !hasBlockedLines;

  const onSubmit = (values: CheckoutValues) => {
    const message = buildOrderMessage({ settings, cart: priced, values });
    window.open(buildWhatsAppUrl(settings.whatsappNumber, message), "_blank");
    onSent();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4 pb-32">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-name" className={labelClasses}>Nome *</Label>
            <Input
              id="checkout-name"
              autoComplete="name"
              placeholder="Seu nome completo"
              className={inputClasses}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "checkout-name-error" : undefined}
              {...register("name")}
            />
            <FieldError id="checkout-name-error" message={errors.name?.message} />
          </div>

          <div className="space-y-2" role="group" aria-labelledby="checkout-fulfillment-label">
            <span id="checkout-fulfillment-label" className={`${labelClasses} block`}>Tipo de Entrega *</span>
            <div className="grid grid-cols-2 gap-2">
              {fulfillmentOptions.map((opt) => {
                const active = fulfillment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("fulfillment", opt.value, { shouldValidate: true })}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-[#1C1C1C] text-[#E5E5E5] border-[#2A2A2A] hover:border-[#444]"
                    }`}
                    aria-pressed={active}
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!isPickup && (
            <div className="space-y-1.5">
              <Label htmlFor="checkout-address" className={labelClasses}>Endereço de Entrega *</Label>
              <Input
                id="checkout-address"
                autoComplete="street-address"
                placeholder="Rua, número, bairro"
                className={inputClasses}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? "checkout-address-error" : undefined}
                {...register("address")}
              />
              <FieldError id="checkout-address-error" message={errors.address?.message} />
            </div>
          )}

          <div className="space-y-2" role="group" aria-labelledby="checkout-payment-label">
            <span id="checkout-payment-label" className={`${labelClasses} block`}>Forma de Pagamento</span>
            <Controller
              control={control}
              name="payment"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v !== "dinheiro") setValue("changeFor", "", { shouldValidate: true });
                  }}
                  className="space-y-2"
                >
                  {paymentOptions.map((p) => (
                    <label
                      key={p.value}
                      className="flex items-center gap-3 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-4 py-3 cursor-pointer hover:border-[#333] transition-colors"
                    >
                      <RadioGroupItem value={p.value} className="border-[#444] text-primary data-[state=checked]:border-primary" />
                      <span className="text-[#E5E5E5] text-sm">{p.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          {payment === "dinheiro" && (
            <div className="space-y-1.5">
              <Label htmlFor="checkout-change" className={labelClasses}>Precisa de troco? Para quanto?</Label>
              <Input
                id="checkout-change"
                inputMode="decimal"
                placeholder="Ex: 100,00"
                className={inputClasses}
                aria-invalid={!!errors.changeFor}
                aria-describedby={errors.changeFor ? "checkout-change-error" : "checkout-change-hint"}
                {...register("changeFor")}
              />
              <p id="checkout-change-hint" className="text-xs text-[#888]">
                Deixe em branco se não precisar de troco. Total do pedido: {formatBRL(priced.totalCents)}.
              </p>
              <FieldError id="checkout-change-error" message={errors.changeFor?.message} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="checkout-notes" className={labelClasses}>Observações</Label>
            <Textarea
              id="checkout-notes"
              placeholder="Sem cebola, ponto da carne..."
              className={`${inputClasses} min-h-[80px]`}
              rows={3}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "checkout-notes-error" : undefined}
              {...register("notes")}
            />
            <FieldError id="checkout-notes-error" message={errors.notes?.message} />
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
            <span className="text-[#888] text-xs font-medium uppercase tracking-wide">Resumo:</span>
            {priced.lines.map((line) => (
              <div key={line.lineId} className="flex justify-between text-sm">
                <span className="text-[#AAA]">{line.name} x{line.quantity}</span>
                <span className="text-[#E5E5E5]">{formatBRL(line.totalCents)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DrawerFooter totalCents={priced.totalCents}>
        <div className="space-y-2">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#9A3412] hover:bg-[#7C2D12] text-[#E5E5E5] font-bold text-base py-6 disabled:opacity-40 gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar Pedido via WhatsApp
          </Button>
          <Button type="button" variant="ghost" className="w-full text-[#888] hover:text-[#E5E5E5] text-sm" onClick={onBack}>
            ← Voltar à Sacola
          </Button>
          <button type="button" onClick={onAddMore} className="w-full text-primary/70 hover:text-primary text-xs py-2 transition-colors">
            + Adicionar mais itens
          </button>
        </div>
      </DrawerFooter>
    </form>
  );
};

export default CheckoutForm;
