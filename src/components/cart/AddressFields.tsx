import { useEffect, useRef, useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Loader2, LocateFixed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep, isValidCep, normalizeCep } from "@/domain/cep";
import type { CheckoutValues } from "@/domain/checkout";
import { mapsPinUrl } from "@/domain/location";
import type { DeliveryZone } from "@/domain/settings";
import { lookupCep } from "@/services/cepLookup";
import { GeolocationError, geolocationMessage, requestPosition } from "@/services/geolocation";
import FieldError from "./FieldError";
import { inputClasses, labelClasses } from "./fieldStyles";

interface AddressFieldsProps {
  register: UseFormRegister<CheckoutValues>;
  setValue: UseFormSetValue<CheckoutValues>;
  errors: FieldErrors<CheckoutValues>;
  zones: DeliveryZone[];
  serviceAreaText: string;
  cep: string;
  address: string;
  neighborhood: string;
  locationUrl: string;
}

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "info"; text: string } | { kind: "error"; text: string };

/** Endereço de entrega: CEP com preenchimento automático (opcional), campos manuais sempre disponíveis e localização opcional. */
const AddressFields = ({
  register,
  setValue,
  errors,
  zones,
  serviceAreaText,
  cep,
  address,
  neighborhood,
  locationUrl,
}: AddressFieldsProps) => {
  const [cepStatus, setCepStatus] = useState<Status>({ kind: "idle" });
  const [geoStatus, setGeoStatus] = useState<Status>({ kind: "idle" });
  const lastLookedUp = useRef("");
  // Valores atuais sem re-disparar a consulta quando o cliente digita rua/bairro.
  const latest = useRef({ address, neighborhood });
  latest.current = { address, neighborhood };

  useEffect(() => {
    const digits = normalizeCep(cep);
    if (digits.length < 8) {
      lastLookedUp.current = "";
      return;
    }
    if (!isValidCep(digits) || digits === lastLookedUp.current) return;
    lastLookedUp.current = digits;

    let cancelled = false;
    setCepStatus({ kind: "loading" });
    void lookupCep(digits).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setCepStatus({ kind: "error", text: result.message });
        return;
      }
      const { street, neighborhood: hood } = result.address;
      // Nunca sobrescreve o que o cliente já digitou.
      if (street && !latest.current.address.trim()) setValue("address", street, { shouldValidate: true });
      if (hood && !latest.current.neighborhood.trim()) setValue("neighborhood", hood, { shouldValidate: true });
      setCepStatus({
        kind: "info",
        text: street ? "Endereço encontrado. Confira e complete com o número." : "CEP encontrado. Complete rua e número.",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [cep, setValue]);

  const useMyLocation = async () => {
    setGeoStatus({ kind: "loading" });
    try {
      const position = await requestPosition();
      setValue("locationUrl", mapsPinUrl(position.lat, position.lng), { shouldDirty: true });
      setGeoStatus({
        kind: "info",
        text: `Localização anexada (precisão de cerca de ${Math.round(position.accuracy)} m). Preencha o endereço mesmo assim.`,
      });
    } catch (error) {
      setGeoStatus({
        kind: "error",
        text: error instanceof GeolocationError ? error.message : geolocationMessage.unavailable,
      });
    }
  };

  const removeLocation = () => {
    setValue("locationUrl", "", { shouldDirty: true });
    setGeoStatus({ kind: "idle" });
  };

  const statusText = (status: Status) => (status.kind === "info" || status.kind === "error" ? status.text : "");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="checkout-cep" className={labelClasses}>CEP</Label>
        <div className="relative">
          <Input
            id="checkout-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000 (opcional)"
            className={inputClasses}
            aria-invalid={!!errors.cep}
            aria-describedby="checkout-cep-status checkout-cep-error"
            {...register("cep", { onChange: (e) => setValue("cep", formatCep(e.target.value)) })}
          />
          {cepStatus.kind === "loading" && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#888]" aria-hidden="true" />
          )}
        </div>
        <p
          id="checkout-cep-status"
          role="status"
          aria-live="polite"
          className={`text-xs ${cepStatus.kind === "error" ? "text-amber-400" : "text-[#888]"}`}
        >
          {cepStatus.kind === "loading" ? "Buscando endereço…" : statusText(cepStatus)}
        </p>
        <FieldError id="checkout-cep-error" message={errors.cep?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-address" className={labelClasses}>Endereço de Entrega *</Label>
        <Input
          id="checkout-address"
          autoComplete="address-line1"
          placeholder="Rua e número"
          className={inputClasses}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "checkout-address-error" : undefined}
          {...register("address")}
        />
        <FieldError id="checkout-address-error" message={errors.address?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-neighborhood" className={labelClasses}>Bairro *</Label>
          <Input
            id="checkout-neighborhood"
            autoComplete="address-level3"
            list="checkout-neighborhoods"
            className={inputClasses}
            aria-invalid={!!errors.neighborhood}
            aria-describedby={errors.neighborhood ? "checkout-neighborhood-error" : undefined}
            {...register("neighborhood")}
          />
          <datalist id="checkout-neighborhoods">
            {zones.map((z) => (
              <option key={z.id} value={z.name} />
            ))}
          </datalist>
          <FieldError id="checkout-neighborhood-error" message={errors.neighborhood?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkout-complement" className={labelClasses}>Complemento</Label>
          <Input
            id="checkout-complement"
            autoComplete="address-line2"
            placeholder="Apto, bloco…"
            className={inputClasses}
            aria-invalid={!!errors.complement}
            aria-describedby={errors.complement ? "checkout-complement-error" : undefined}
            {...register("complement")}
          />
          <FieldError id="checkout-complement-error" message={errors.complement?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-reference" className={labelClasses}>Ponto de referência</Label>
        <Input
          id="checkout-reference"
          placeholder="Portão azul, perto da praça…"
          className={inputClasses}
          aria-invalid={!!errors.reference}
          aria-describedby={errors.reference ? "checkout-reference-error" : undefined}
          {...register("reference")}
        />
        <FieldError id="checkout-reference-error" message={errors.reference?.message} />
      </div>

      {serviceAreaText && <p className="text-xs text-[#888]">{serviceAreaText}</p>}

      <div className="space-y-1.5">
        {locationUrl ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-2">
            <span className="text-xs text-[#E5E5E5]">Localização anexada ao pedido</span>
            <button
              type="button"
              onClick={removeLocation}
              className="inline-flex items-center gap-1 text-xs text-[#AAA] hover:text-[#E5E5E5] focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
              aria-label="Remover localização anexada"
            >
              <X className="h-3 w-3" aria-hidden="true" /> Remover
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={useMyLocation}
            disabled={geoStatus.kind === "loading"}
            className="w-full border-[#2A2A2A] bg-[#1C1C1C] text-[#E5E5E5] hover:bg-[#2A2A2A] gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {geoStatus.kind === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            )}
            Usar minha localização (opcional)
          </Button>
        )}
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${geoStatus.kind === "error" ? "text-amber-400" : "text-[#888]"}`}
        >
          {statusText(geoStatus)}
        </p>
      </div>
    </div>
  );
};

export default AddressFields;
