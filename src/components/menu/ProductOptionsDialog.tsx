import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { validateAddonSelection } from "@/domain/addons";
import { MAX_LINE_QUANTITY } from "@/domain/cart";
import { formatBRL } from "@/domain/money";
import { unitPrice } from "@/domain/pricing";
import type { Product } from "@/domain/types";

interface ProductOptionsDialogProps {
  product: Product;
  onConfirm: (selection: { addonOptionIds: string[]; note: string; quantity: number }) => void;
  onClose: () => void;
}

const NOTE_MAX = 200;

/** Escolha de adicionais, observação e quantidade antes de ir para a sacola. */
const ProductOptionsDialog = ({ product, onConfirm, onClose }: ProductOptionsDialogProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const validation = validateAddonSelection(product, selected);
  const errors = validation.ok ? {} : validation.errors;
  const unit = unitPrice(product, selected).cents;

  const setGroup = (groupId: string, ids: string[]) => {
    const group = product.addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const others = selected.filter((id) => !group.options.some((o) => o.id === id));
    setSelected([...others, ...ids]);
  };

  const toggle = (groupId: string, optionId: string, checked: boolean) => {
    const group = product.addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const current = group.options.filter((o) => selected.includes(o.id)).map((o) => o.id);
    const next = checked ? [...current, optionId] : current.filter((id) => id !== optionId);
    setGroup(groupId, next);
  };

  const confirm = () => {
    setSubmitted(true);
    if (!validation.ok) return;
    onConfirm({ addonOptionIds: selected, note: note.trim(), quantity });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border-[#2A2A2A] text-[#E5E5E5]">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-2xl tracking-wide">{product.name}</DialogTitle>
          <DialogDescription className="text-[#AAA]">{product.description || "Escolha como quer o seu item."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {product.addonGroups
            .filter((g) => g.options.length > 0)
            .map((group) => {
              const error = submitted ? errors[group.id] : undefined;
              const single = group.maxSelect === 1;
              const legendId = `group-${group.id}`;
              return (
                <fieldset key={group.id} className="space-y-2" aria-describedby={error ? `${legendId}-error` : undefined}>
                  <legend id={legendId} className="text-xs font-semibold uppercase tracking-wide">
                    {group.name} <span className="text-[#888] normal-case font-normal">
                      {group.required ? "(obrigatório)" : "(opcional)"}
                      {single ? "" : ` — até ${group.maxSelect}`}
                    </span>
                  </legend>
                  {single ? (
                    <RadioGroup
                      aria-labelledby={legendId}
                      value={group.options.find((o) => selected.includes(o.id))?.id ?? ""}
                      onValueChange={(v) => setGroup(group.id, [v])}
                    >
                      {group.options.map((o) => (
                        <label key={o.id} className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-3 cursor-pointer">
                          <RadioGroupItem value={o.id} className="border-[#444] text-primary" />
                          <span className="flex-1 text-sm">{o.name}</span>
                          {o.priceCents > 0 && <span className="text-sm text-primary">+ {formatBRL(o.priceCents)}</span>}
                        </label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {group.options.map((o) => {
                        const checked = selected.includes(o.id);
                        const count = group.options.filter((x) => selected.includes(x.id)).length;
                        return (
                          <label key={o.id} className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-3 cursor-pointer">
                            <Checkbox
                              checked={checked}
                              disabled={!checked && count >= group.maxSelect}
                              onCheckedChange={(v) => toggle(group.id, o.id, v === true)}
                            />
                            <span className="flex-1 text-sm">{o.name}</span>
                            {o.priceCents > 0 && <span className="text-sm text-primary">+ {formatBRL(o.priceCents)}</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {error && (
                    <p id={`${legendId}-error`} role="alert" className="text-xs text-red-400">
                      {error}
                    </p>
                  )}
                </fieldset>
              );
            })}

          <div className="space-y-1.5">
            <Label htmlFor="option-note" className="text-xs font-semibold uppercase tracking-wide">Observação do item</Label>
            <Textarea
              id="option-note"
              value={note}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Sem cebola, ponto da carne…"
              className="bg-[#1C1C1C] border-[#2A2A2A] text-[#E5E5E5] placeholder:text-[#666]"
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 border-[#2A2A2A] bg-[#1C1C1C]"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-bold" aria-live="polite">{quantity}</span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 border-[#2A2A2A] bg-[#1C1C1C]"
              onClick={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" onClick={confirm} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            Adicionar • {formatBRL(unit * quantity)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOptionsDialog;
