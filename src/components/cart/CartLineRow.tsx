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
}

const CartLineRow = ({ line, onIncrement, onDecrement, onRemove }: CartLineRowProps) => {
  const unavailable = line.unavailableReason;

  return (
    <div className="flex items-center justify-between bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-3">
      <div className="flex-1 min-w-0">
        <p className="text-[#E5E5E5] text-sm font-medium truncate">{line.name}</p>
        {line.addonNames.length > 0 && (
          <p className="text-[#888] text-xs truncate">+ {line.addonNames.join(", ")}</p>
        )}
        {line.note && <p className="text-[#888] text-xs truncate">Obs: {line.note}</p>}
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
  );
};

export default CartLineRow;
