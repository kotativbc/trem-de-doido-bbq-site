import { useRef, useState, type FormEvent } from "react";
import { ImageOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { menuImages, resolveProductImage } from "@/data/menuImages";
import { uniqueId } from "@/domain/ids";
import { formatDecimalBRL, parseBRLToCents } from "@/domain/money";
import { productSchema } from "@/domain/schemas";
import type { Catalog, Product } from "@/domain/types";
import { repositories } from "@/services";
import AddonGroupsEditor, { type GroupDraft } from "./AddonGroupsEditor";

interface ProductFormDialogProps {
  /** undefined = novo produto. */
  product?: Product;
  catalog: Catalog;
  defaultCategoryId?: string;
  onSave: (product: Product) => Promise<boolean>;
  onClose: () => void;
}

const selectClasses =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

const toDrafts = (product?: Product): GroupDraft[] =>
  (product?.addonGroups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    maxSelect: g.maxSelect,
    required: g.required,
    options: g.options.map((o) => ({ id: o.id, name: o.name, priceText: o.priceCents ? formatDecimalBRL(o.priceCents) : "" })),
  }));

const ProductFormDialog = ({ product, catalog, defaultCategoryId, onSave, onClose }: ProductFormDialogProps) => {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? formatDecimalBRL(product.priceCents) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? defaultCategoryId ?? catalog.categories[0]?.id ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [soldOut, setSoldOut] = useState(product?.soldOut ?? false);
  const [sundayOnly, setSundayOnly] = useState(product?.sundayOnly ?? false);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [imageKey, setImageKey] = useState(product?.imageKey ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [groups, setGroups] = useState<GroupDraft[]>(() => toDrafts(product));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = resolveProductImage({ imageUrl: imageUrl || undefined, imageKey: imageKey || undefined });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      // Modo demo: fica no navegador. Servidor PHP: é enviada e vira um endereço /uploads/...
      setImageUrl(await repositories.catalog.saveImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const priceCents = parseBRLToCents(price);
    if (priceCents === null || priceCents <= 0) {
      setError("Informe um preço válido, por exemplo 36,90.");
      return;
    }

    const addonGroups = [];
    for (const g of groups) {
      const options = [];
      for (const o of g.options) {
        const cents = o.priceText.trim() === "" ? 0 : parseBRLToCents(o.priceText);
        if (cents === null) {
          setError(`Preço inválido na opção "${o.name || "sem nome"}" do grupo "${g.name || "sem nome"}".`);
          return;
        }
        options.push({ id: o.id, name: o.name, priceCents: cents });
      }
      addonGroups.push({ id: g.id, name: g.name, maxSelect: g.maxSelect, required: g.required, options });
    }

    const siblings = catalog.products.filter((p) => p.categoryId === categoryId && p.id !== product?.id);
    const sameCategory = product && product.categoryId === categoryId;
    const candidate: Product = {
      id: product?.id ?? uniqueId(name, catalog.products.map((p) => p.id)),
      name,
      description,
      priceCents,
      categoryId,
      ...(badge.trim() ? { badge: badge.trim() } : {}),
      ...(imageKey ? { imageKey } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      active,
      soldOut,
      sundayOnly,
      featured,
      order: sameCategory ? product.order : Math.max(-1, ...siblings.map((p) => p.order)) + 1,
      addonGroups,
    };

    const parsed = productSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${issue.message === "Required" ? "Campo obrigatório" : issue.message} (${issue.path.join(" › ")})`);
      return;
    }

    setBusy(true);
    const ok = await onSave(parsed.data);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-2xl tracking-wide">{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>As mudanças aparecem no site assim que você salvar.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-name">Nome *</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea id="p-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Preço (R$) *</Label>
              <Input id="p-price" inputMode="decimal" placeholder="36,90" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Categoria *</Label>
              <select id="p-cat" className={selectClasses} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-badge">Selo (opcional)</Label>
              <Input id="p-badge" placeholder="Novo" maxLength={20} value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["p-active", "Ativo (aparece no site)", active, setActive],
              ["p-soldout", "Esgotado", soldOut, setSoldOut],
              ["p-sunday", "Somente aos domingos (selo Especial)", sundayOnly, setSundayOnly],
              ["p-featured", "Destaque", featured, setFeatured],
            ].map(([id, label, value, setter]) => (
              <label key={id as string} htmlFor={id as string} className="flex items-center gap-2 text-sm">
                <Switch id={id as string} checked={value as boolean} onCheckedChange={setter as (v: boolean) => void} />
                {label as string}
              </label>
            ))}
          </div>

          <fieldset className="space-y-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Imagem</legend>
            <div className="flex items-center gap-4">
              {preview ? (
                <img src={preview} alt="Prévia da imagem do produto" className="h-20 w-28 rounded-md object-cover" width={112} height={80} />
              ) : (
                <div className="flex h-20 w-28 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-label="Sem imagem">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} id="p-file" aria-label="Enviar imagem do produto" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" aria-hidden="true" /> Enviar imagem
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!preview}
                  onClick={() => {
                    setImageKey("");
                    setImageUrl("");
                  }}
                >
                  Remover imagem
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-imagekey">Ou escolha uma imagem do projeto</Label>
              <select
                id="p-imagekey"
                className={selectClasses}
                value={imageUrl ? "" : imageKey}
                onChange={(e) => {
                  setImageKey(e.target.value);
                  setImageUrl("");
                }}
              >
                <option value="">— nenhuma —</option>
                {Object.keys(menuImages).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Adicionais e opções</legend>
            <AddonGroupsEditor groups={groups} onChange={setGroups} />
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? "Salvando…" : "Salvar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
