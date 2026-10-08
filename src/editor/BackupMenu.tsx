import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminRun } from "@/admin/useAdminRun";
import { catalogQueryKey } from "@/hooks/useCatalog";
import { catalogSchema } from "@/domain/schemas";
import type { Catalog } from "@/domain/types";
import { repositories } from "@/services";
import { toast } from "sonner";

const today = (): string => new Date().toISOString().slice(0, 10);

/** Baixa o cardápio atual como arquivo (cópia de segurança) e restaura a partir de um arquivo. */
const BackupMenu = () => {
  const run = useAdminRun();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Catalog | null>(null);

  const download = async () => {
    try {
      const catalog = await repositories.catalog.getCatalog();
      const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cardapio-${today()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível baixar a cópia.");
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = catalogSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error("invalid");
      setPending(parsed.data);
    } catch {
      toast.error("Este arquivo não é uma cópia de cardápio válida.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void download()}>
        <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Baixar cópia
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Escolher arquivo de cópia do cardápio"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-1 h-4 w-4" aria-hidden="true" /> Restaurar cópia
      </Button>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar esta cópia?</AlertDialogTitle>
            <AlertDialogDescription>
              O cardápio atual será substituído por esta cópia ({pending?.products.length} produtos em {pending?.categories.length} categorias).
              Se quiser poder voltar atrás, baixe uma cópia do cardápio atual antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const catalog = pending;
                setPending(null);
                if (catalog) {
                  void run(() => repositories.catalog.replaceCatalog(catalog), {
                    success: "Cardápio restaurado.",
                    invalidate: [catalogQueryKey],
                  });
                }
              }}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupMenu;
