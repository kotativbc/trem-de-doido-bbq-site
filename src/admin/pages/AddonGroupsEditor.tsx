import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export interface OptionDraft {
  id: string;
  name: string;
  /** Texto digitado em reais, ex.: "5,00". */
  priceText: string;
}
export interface GroupDraft {
  id: string;
  name: string;
  maxSelect: number;
  required: boolean;
  options: OptionDraft[];
}

interface AddonGroupsEditorProps {
  groups: GroupDraft[];
  onChange: (groups: GroupDraft[]) => void;
}

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const AddonGroupsEditor = ({ groups, onChange }: AddonGroupsEditorProps) => {
  const patchGroup = (id: string, patch: Partial<GroupDraft>) =>
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const patchOption = (groupId: string, optionId: string, patch: Partial<OptionDraft>) =>
    onChange(
      groups.map((g) =>
        g.id === groupId ? { ...g, options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) } : g,
      ),
    );

  return (
    <div className="space-y-4">
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Sem adicionais. O item vai direto para a sacola.</p>}

      {groups.map((g, gi) => (
        <fieldset key={g.id} className="space-y-3 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grupo {gi + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
            <Input aria-label={`Nome do grupo ${gi + 1}`} placeholder="Ex.: Extras" value={g.name} onChange={(e) => patchGroup(g.id, { name: e.target.value })} />
            <Input
              aria-label={`Máximo de escolhas do grupo ${gi + 1}`}
              type="number"
              min={1}
              max={20}
              value={g.maxSelect}
              onChange={(e) => patchGroup(g.id, { maxSelect: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={g.required} onCheckedChange={(v) => patchGroup(g.id, { required: v })} aria-label={`Grupo ${gi + 1} obrigatório`} />
            Escolha obrigatória
          </label>

          {g.options.map((o, oi) => (
            <div key={o.id} className="grid grid-cols-[1fr_6rem_auto] gap-2">
              <Input aria-label={`Nome da opção ${oi + 1} do grupo ${gi + 1}`} placeholder="Opção" value={o.name} onChange={(e) => patchOption(g.id, o.id, { name: e.target.value })} />
              <Input
                aria-label={`Preço da opção ${oi + 1} do grupo ${gi + 1}`}
                inputMode="decimal"
                placeholder="0,00"
                value={o.priceText}
                onChange={(e) => patchOption(g.id, o.id, { priceText: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover opção ${oi + 1} do grupo ${gi + 1}`}
                onClick={() => patchGroup(g.id, { options: g.options.filter((x) => x.id !== o.id) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => patchGroup(g.id, { options: [...g.options, { id: newId("o"), name: "", priceText: "" }] })}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Opção
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(groups.filter((x) => x.id !== g.id))}>
              Remover grupo
            </Button>
          </div>
        </fieldset>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...groups, { id: newId("g"), name: "", maxSelect: 1, required: false, options: [{ id: newId("o"), name: "", priceText: "" }] }])}
      >
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Grupo de adicionais
      </Button>
    </div>
  );
};

export default AddonGroupsEditor;
