import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { applyCoupon } from "@/domain/coupons";
import {
  createCheckoutSchema,
  emptyCheckoutValues,
  fulfillmentOptions,
  paymentOptions,
  type CheckoutValues,
} from "@/domain/checkout";
import { estimateTimeText, getMinOrderShortfall, resolveDeliveryFee } from "@/domain/delivery";
import { getOpenStatus } from "@/domain/hours";
import { formatBRL } from "@/domain/money";
import { buildOrder, generateOrderId, type Order } from "@/domain/orders";
import { formatPhoneBR } from "@/domain/phone";
import type { BusinessSettings } from "@/domain/settings";
import type { PricedCart } from "@/domain/types";
import { buildOrderMessage, buildWhatsAppUrl } from "@/domain/whatsapp";
import { useBeforeUnloadWarning } from "@/hooks/useBeforeUnloadWarning";
import { useCart } from "@/hooks/useCart";
import { useCoupons } from "@/hooks/useCoupons";
import AddressFields from "./AddressFields";
import CouponField from "./CouponField";
import DrawerFooter from "./DrawerFooter";
import FieldError from "./FieldError";
import { inputClasses, labelClasses } from "./fieldStyles";

export interface SubmittedOrder {
  order: Order;
  whatsappUrl: string;
  /** false quando o navegador bloqueou a nova janela. */
  opened: boolean;
}

interface CheckoutFormProps {
  priced: PricedCart;
  settings: BusinessSettings;
  onBack: () => void;
  onAddMore: () => void;
  /** Chamado depois de tentar abrir o WhatsApp com a mensagem do pedido. */
  onSubmitted: (result: SubmittedOrder) => void;
}

const CheckoutForm = ({ priced, settings, onBack, onAddMore, onSubmitted }: CheckoutFormProps) => {
  const { priceWith } = useCart();
  const couponsQuery = useCoupons();
  const deliveryEnabled = settings.delivery.enabled;

  // O total depende de taxa e cupom (que dependem do que o cliente digita); o resolver lê o total mais recente.
  const totalRef = useRef(priced.totalCents);
  const resolver = useMemo<Resolver<CheckoutValues>>(
    () => (values, context, options) =>
      zodResolver(createCheckoutSchema({ totalCents: totalRef.current }))(values, context, options),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isDirty },
  } = useForm<CheckoutValues>({
    resolver,
    defaultValues: { ...emptyCheckoutValues, fulfillment: deliveryEnabled ? "entrega" : "retirada" },
    mode: "onTouched",
  });

  const fulfillment = watch("fulfillment");
  const payment = watch("payment");
  const neighborhood = watch("neighborhood");
  const changeFor = watch("changeFor");
  const isPickup = fulfillment === "retirada";

  const [appliedCode, setAppliedCode] = useState("");
  const now = new Date();

  const subtotalCents = priced.subtotalCents;
  const couponResult = useMemo(
    () =>
      appliedCode
        ? applyCoupon(couponsQuery.data ?? [], appliedCode, subtotalCents, now, settings.timezone, formatBRL)
        : null,
    // `now` muda a cada render; o cupom só precisa ser reavaliado quando algo relevante muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appliedCode, couponsQuery.data, subtotalCents, settings.timezone],
  );

  const fee = resolveDeliveryFee(settings.delivery, fulfillment, neighborhood);
  const quote = priceWith({
    deliveryFeeCents: fee.feeCents,
    discountCents: couponResult?.ok ? couponResult.discountCents : 0,
  });
  totalRef.current = quote.totalCents;

  // O troco precisa cobrir o total: revalida quando o total muda (cupom, bairro, modalidade).
  useEffect(() => {
    if (changeFor.trim() !== "") void trigger("changeFor");
  }, [quote.totalCents, changeFor, trigger]);

  useBeforeUnloadWarning(isDirty);

  const openStatus = getOpenStatus(settings, now);
  const closedBlocksOrder = !openStatus.open && !settings.ordering.allowOrdersWhenClosed;
  const shortfall = getMinOrderShortfall(settings.delivery, fulfillment, quote.subtotalCents);
  const hasBlockedLines = quote.lines.some((l) => l.unavailableReason);
  const canSubmit = isValid && quote.subtotalCents > 0 && !hasBlockedLines && !closedBlocksOrder && shortfall === 0;

  const orderIdRef = useRef(generateOrderId());
  const estimate = estimateTimeText(settings.delivery, fulfillment);
  const showBreakdown = quote.discountCents > 0 || quote.deliveryFeeCents > 0 || fee.zoneName !== undefined;
  const availableFulfillment = fulfillmentOptions.filter((o) => deliveryEnabled || o.value === "retirada");

  const onSubmit = (raw: CheckoutValues) => {
    // O telefone sempre sai formatado, mesmo que o cliente não tenha saído do campo antes de enviar.
    const values = { ...raw, phone: formatPhoneBR(raw.phone) };
    const couponCode = couponResult?.ok ? couponResult.coupon.code : undefined;
    const message = buildOrderMessage({
      settings,
      cart: quote,
      values,
      extras: { orderId: orderIdRef.current, couponCode, estimate },
    });
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, message);
    // window.open precisa rodar dentro do clique para não ser bloqueado como pop-up.
    const opened = window.open(whatsappUrl, "_blank") !== null;
    const order = buildOrder({
      id: orderIdRef.current,
      now: new Date(),
      values,
      cart: quote,
      couponCode,
      estimate,
      whatsappMessage: message,
    });
    onSubmitted({ order, whatsappUrl, opened });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4 pb-32">
        <div className="space-y-5">
          {!openStatus.open && (
            <div role="alert" className="flex gap-2 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-300">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                {closedBlocksOrder
                  ? "Estamos fechados no momento e não é possível enviar pedidos agora."
                  : "Estamos fechados no momento. Você pode enviar o pedido, mas ele só será atendido quando abrirmos."}
                {openStatus.nextOpening ? ` Abrimos ${openStatus.nextOpening}.` : ""}
              </p>
            </div>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" className={labelClasses}>Telefone / WhatsApp *</Label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(31) 99999-9999"
              className={inputClasses}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
              {...register("phone", { onBlur: (e) => setValue("phone", formatPhoneBR(e.target.value)) })}
            />
            <FieldError id="checkout-phone-error" message={errors.phone?.message} />
          </div>

          <div className="space-y-2" role="group" aria-labelledby="checkout-fulfillment-label">
            <span id="checkout-fulfillment-label" className={`${labelClasses} block`}>Tipo de Entrega *</span>
            <div className={`grid gap-2 ${availableFulfillment.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {availableFulfillment.map((opt) => {
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
            {!deliveryEnabled && (
              <p className="text-xs text-[#888]">No momento atendemos apenas retirada no balcão.</p>
            )}
          </div>

          {!isPickup && (
            <AddressFields
              register={register}
              setValue={setValue}
              errors={errors}
              zones={settings.delivery.zones}
              serviceAreaText={settings.delivery.serviceAreaText}
              cep={watch("cep")}
              address={watch("address")}
              neighborhood={neighborhood}
              locationUrl={watch("locationUrl")}
            />
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
            <p className="text-xs text-[#888]">O pagamento é combinado na entrega ou retirada; não cobramos nada pelo site.</p>
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
                Deixe em branco se não precisar de troco. Total do pedido: {formatBRL(quote.totalCents)}.
              </p>
              <FieldError id="checkout-change-error" message={errors.changeFor?.message} />
            </div>
          )}

          <CouponField
            appliedCode={appliedCode}
            result={couponResult}
            onApply={(code) => setAppliedCode(code)}
            onRemove={() => setAppliedCode("")}
          />

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
            {quote.lines.map((line) => (
              <div key={line.lineId} className="flex justify-between text-sm">
                <span className="text-[#AAA]">{line.name} x{line.quantity}</span>
                <span className="text-[#E5E5E5]">{formatBRL(line.totalCents)}</span>
              </div>
            ))}
            {showBreakdown && (
              <dl className="border-t border-[#2A2A2A] pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#AAA]">Subtotal</dt>
                  <dd className="text-[#E5E5E5]">{formatBRL(quote.subtotalCents)}</dd>
                </div>
                {quote.discountCents > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-green-400">Desconto</dt>
                    <dd className="text-green-400">- {formatBRL(quote.discountCents)}</dd>
                  </div>
                )}
                {(quote.deliveryFeeCents > 0 || fee.zoneName !== undefined) && (
                  <div className="flex justify-between">
                    <dt className="text-[#AAA]">Taxa de entrega</dt>
                    <dd className="text-[#E5E5E5]">{quote.deliveryFeeCents > 0 ? formatBRL(quote.deliveryFeeCents) : "Grátis"}</dd>
                  </div>
                )}
              </dl>
            )}
            <p className="text-xs text-[#888] pt-1">Previsão: {estimate}</p>
          </div>

          {shortfall > 0 && (
            <p role="alert" className="text-sm text-amber-400">
              Pedido mínimo para entrega: {formatBRL(settings.delivery.minOrderCents)}. Faltam {formatBRL(shortfall)} em itens, ou escolha retirar no balcão.
            </p>
          )}
        </div>
      </div>

      <DrawerFooter totalCents={quote.totalCents}>
        <div className="space-y-2">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#9A3412] hover:bg-[#7C2D12] text-[#E5E5E5] font-bold text-base py-6 disabled:opacity-40 gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar Pedido via WhatsApp
          </Button>
          <Button type="button" variant="ghost" className="w-full text-[#999] hover:bg-[#1F1F1F] hover:text-[#E5E5E5] text-sm" onClick={onBack}>
            ← Voltar à Sacola
          </Button>
          <button type="button" onClick={onAddMore} className="w-full text-primary hover:text-primary/80 text-xs py-2 transition-colors">
            + Adicionar mais itens
          </button>
        </div>
      </DrawerFooter>
    </form>
  );
};

export default CheckoutForm;
