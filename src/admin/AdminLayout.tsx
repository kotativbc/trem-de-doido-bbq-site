import { Link, NavLink, Outlet } from "react-router-dom";
import { ExternalLink, Flame, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSharedCatalog } from "@/services";
import { useAdminAuth } from "./adminAuthContext";

const allLinks = [
  { to: "/admin", label: "Resumo", end: true },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/cupons", label: "Cupons" },
  { to: "/admin/configuracoes", label: "Configurações" },
];

// Com cardápio no servidor, produtos e categorias são editados pelo link secreto, não aqui.
const AdminLayout = () => {
  const { logout } = useAdminAuth();
  const links = isSharedCatalog ? allLinks.filter((l) => !/produtos|categorias/.test(l.to)) : allLinks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md print:hidden">
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
          <Link to="/admin" className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-['Bebas_Neue'] text-xl tracking-wider">PAINEL</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" /> Ver site
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={logout} className="border-border">
              <LogOut className="mr-1 h-4 w-4" aria-hidden="true" /> Sair
            </Button>
          </div>
        </div>
        <nav aria-label="Seções do painel" className="container mx-auto flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
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
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
