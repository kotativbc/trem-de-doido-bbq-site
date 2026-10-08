import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, type Cents } from "@/domain/money";
import type { CouponResult } from "@/domain/coupons";
import { inputClasses, labelClasses } from "./fieldStyles";

interface CouponFieldProps {
  appliedCode: string;
  result: CouponResult | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}

const CouponField = ({ appliedCode, result, onApply, onRemove }: CouponFieldProps) => {
  const [draft, setDraft] = useState("");

  if (appliedCode && result?.ok) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-green-700/50 bg-green-950/30 px-3 py-2" role="status">
        <span className="flex items-center gap-2 text-sm text-green-400">
          <Tag className="h-4 w-4" aria-hidden="true" />
          Cupom {result.coupon.code} aplicado: - {formatBRL(result.discountCents as Cents)}
        </span>
        <button
          type="button"
          onClick={() => {
            onRemove();
            setDraft("");
          }}
          className="inline-flex items-center gap-1 text-xs text-[#AAA] hover:text-[#E5E5E5] focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
          aria-label={`Remover cupom ${result.coupon.code}`}
        >
          <X className="h-3 w-3" aria-hidden="true" /> Remover
        </button>
      </div>
    );
  }

  const submit = () => {
    if (draft.trim()) onApply(draft);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="checkout-coupon" className={labelClasses}>Cupom de desconto</Label>
      <div className="flex gap-2">
        <Input
          id="checkout-coupon"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter aqui aplica o cupom; não envia o pedido.
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Digite o código"
          className={inputClasses}
          aria-describedby="checkout-coupon-message"
          aria-invalid={result !== null && !result.ok}
        />
        <Button
          type="button"
          variant="outline"
          onClick={submit}
          disabled={!draft.trim()}
          className="border-[#2A2A2A] bg-[#1C1C1C] text-primary hover:bg-primary hover:text-primary-foreground shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Aplicar
        </Button>
      </div>
      <p id="checkout-coupon-message" role="status" aria-live="polite" className="text-xs text-red-400 min-h-4">
        {result && !result.ok ? result.message : ""}
      </p>
    </div>
  );
};

export default CouponField;
