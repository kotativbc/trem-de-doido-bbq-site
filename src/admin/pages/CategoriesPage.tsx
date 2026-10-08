import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { uniqueId } from "@/domain/ids";
import { categorySchema } from "@/domain/schemas";
import type { Catalog, Category } from "@/domain/types";
import { catalogQueryKey, useCatalog } from "@/hooks/useCatalog";
import { repositories } from "@/services";
import { useAdminRun } from "../useAdminRun";

const CategoryForm = ({
  category,
  catalog,
  onSave,
  onClose,
}: {
  category?: Category;
  catalog: Catalog;
  onSave: (c: Category) => Promise<boolean>;
  onClose: () => void;
}) => {
  const [label, setLabel] = useState(category?.label ?? "");
  const [sundayOnly, setSundayOnly] = useState(category?.sundayOnly ?? false);
  const [active, setActive] = useState(category?.active ?? true);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const candidate: Category = {
      id: category?.id ?? uniqueId(label, catalog.categories.map((c) => c.id)),
      label,
      sundayOnly,
      active,
      order: category?.order ?? Math.max(-1, ...catalog.categories.map((c) => c.order)) + 1,
    };
    const parsed = categorySchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message === "Required" ? "Informe o nome da categoria." : parsed.error.issues[0].message);
      return;
    }
    if (await onSave(parsed.data)) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-2xl tracking-wide">{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>O nome aparece na aba do cardápio; um emoji no começo deixa a aba mais fácil de achar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-label">Nome *</Label>
            <Input id="c-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="🍔 Hambúrgueres" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={sundayOnly} onCheckedChange={setSundayOnly} aria-label="Somente aos domingos" /> Mostrar aviso "Disponível somente aos domingos"
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Categoria ativa" /> Ativa (aparece no site)
          </label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Salvar categoria</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CategoriesPage = () => {
  const { data: catalog, isLoading, isError, refetch } = useCatalog();
  const run = useAdminRun();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categories = useMemo(() => [...(catalog?.categories ?? [])].sort((a, b) => a.order - b.order), [catalog]);
  const countOf = (id: string) => catalog?.products.filter((p) => p.categoryId === id).length ?? 0;

  const save = (c: Category) => run(() => repositories.catalog.upsertCategory(c), { success: "Categoria salva.", invalidate: [catalogQueryKey] });

  const move = (id: string, delta: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(() => repositories.catalog.reorderCategories(ids), { invalidate: [catalogQueryKey] });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-['Bebas_Neue'] text-4xl">CATEGORIAS</h1>
        <Button onClick={() => setEditing("new")} disabled={!catalog} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label="Carregando categorias">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : isError || !catalog ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar as categorias.</p>
          <button className="text-primary underline" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma categoria. Crie a primeira para começar o cardápio.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-[#111111] p-3">
              <div className="min-w-[10rem] flex-1">
                <p className="font-semibold">{c.label}</p>
                <p className="text-xs text-muted-foreground">
                  {countOf(c.id)} {countOf(c.id) === 1 ? "produto" : "produtos"}{c.sundayOnly ? " · aviso de domingo" : ""}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={c.active} aria-label={`${c.label}: ativa`} onCheckedChange={(v) => void save({ ...c, active: v })} /> Ativa
              </label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label={`Subir ${c.label}`} disabled={i === 0} onClick={() => move(c.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`Descer ${c.label}`} disabled={i === categories.length - 1} onClick={() => move(c.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label={`Editar ${c.label}`} onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label={`Excluir ${c.label}`} onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && catalog && (
        <CategoryForm category={editing === "new" ? undefined : editing} catalog={catalog} onSave={save} onClose={() => setEditing(null)} />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleting?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && countOf(deleting.id) > 0
                ? "Esta categoria ainda tem produtos. Mova ou exclua os produtos primeiro; ou desative a categoria para escondê-la."
                : "A categoria será removida. Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) void run(() => repositories.catalog.deleteCategory(deleting.id), { success: "Categoria excluída.", invalidate: [catalogQueryKey] });
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;
