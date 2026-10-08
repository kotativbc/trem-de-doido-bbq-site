import { NavLink, Outlet } from "react-router-dom";
import { ExternalLink, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSharedCatalog } from "@/services";
import BackupMenu from "./BackupMenu";

const EditorLayout = ({ token }: { token: string }) => {
  const base = `/gerenciar/${token}`;
  const links = [
    { to: base, label: "Produtos", end: true },
    { to: `${base}/categorias`, label: "Categorias" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-['Bebas_Neue'] text-xl tracking-wider">EDITOR DO CARDÁPIO</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BackupMenu />
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <a href={`${import.meta.env.BASE_URL}#cardapio`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" /> Ver no site
              </a>
            </Button>
          </div>
        </div>
        <nav aria-label="Seções do editor" className="container mx-auto flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-[#1A1A1A] text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6">
        <p className="mb-4 rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-muted-foreground">
          {isSharedCatalog
            ? "Cada alteração é salva na hora e aparece no site para todos os clientes. Guarde este link: quem o tiver consegue editar o cardápio."
            : "Modo de teste: as alterações ficam só neste navegador e não aparecem para outros visitantes."}
        </p>
        <Outlet />
      </main>
    </div>
  );
};

export default EditorLayout;
