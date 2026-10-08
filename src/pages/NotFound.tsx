import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

const NotFound = () => {
  usePageMeta("Página não encontrada | Trem de Doido BBQ", { noindex: true });
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <Flame
          className="mx-auto mb-4 h-10 w-10 text-primary"
          aria-hidden="true"
        />
        <h1 className="mb-2 font-['Bebas_Neue'] text-6xl text-foreground">
          404
        </h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Essa página não existe ou saiu do cardápio.
        </p>
        <Link
          to="/"
          className="text-primary underline hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
