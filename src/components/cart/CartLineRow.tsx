import { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unavailableMessage } from "@/domain/availability";
import { formatBRL } from "@/domain/money";
import type { PricedLine } from "@/domain/types";

interface CartLineRowProps {
  line: PricedLine;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onNoteChange: (lineId: string, note: string) => void;
}

const NOTE_MAX = 200;

const CartLineRow = ({ line, onIncrement, onDecrement, onRemove, onNoteChange }: CartLineRowProps) => {
  const unavailable = line.unavailableReason;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(line.note);

  const saveNote = () => {
    setEditing(false);
    if (draft.trim() !== line.note) onNoteChange(line.lineId, draft);
  };

  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-3">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[#E5E5E5] text-sm font-medium truncate">{line.name}</p>
        {line.addonNames.length > 0 && (
          <p className="text-[#888] text-xs truncate">+ {line.addonNames.join(", ")}</p>
        )}
        {line.note && !editing && <p className="text-[#888] text-xs truncate">Obs: {line.note}</p>}
        {unavailable ? (
          <p className="text-red-400 text-xs" role="alert">
            {unavailableMessage[unavailable]} Remova para continuar.
          </p>
        ) : (
          <p className="text-primary text-sm font-bold">{formatBRL(line.totalCents)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3">
        {unavailable ? (
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-[#2A2A2A] bg-[#0A0A0A] text-[#E5E5E5] hover:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => onRemove(line.lineId)}
            aria-label={`Remover ${line.name} da sacola`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ) : (
          <>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 border-[#2A2A2A] bg-[#0A0A0A] text-[#E5E5E5] hover:bg-[#2A2A2A] focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => onDecrement(line.lineId)}
              aria-label={`Remover ${line.name}`}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[#E5E5E5] font-bold w-5 text-center text-sm">{line.quantity}</span>
            <Button
              size="icon"
              className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => onIncrement(line.lineId)}
              aria-label={`Adicionar mais ${line.name}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>

    {!unavailable && (
      <div className="mt-2">
        {editing ? (
          <div className="flex gap-2">
            <label htmlFor={`note-${line.lineId}`} className="sr-only">Observação de {line.name}</label>
            <input
              id={`note-${line.lineId}`}
              autoFocus
              value={draft}
              maxLength={NOTE_MAX}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveNote}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveNote();
                }
                if (e.key === "Escape") {
                  // Escape fecha só o campo, não o carrinho inteiro.
                  e.stopPropagation();
                  setDraft(line.note);
                  setEditing(false);
                }
              }}
              placeholder="Sem cebola, ponto da carne…"
              className="flex-1 min-w-0 rounded border border-[#2A2A2A] bg-[#0A0A0A] px-2 py-1 text-xs text-[#E5E5E5] placeholder:text-[#666] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(line.note);
              setEditing(true);
            }}
            className="text-xs text-primary/70 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            {line.note ? "Editar observação" : "+ Observação do item"}
          </button>
        )}
      </div>
    )}
    </div>
  );
};

export default CartLineRow;
