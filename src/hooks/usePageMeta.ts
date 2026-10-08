import { useEffect } from "react";

/**
 * Título da aba e `noindex` para páginas que não devem aparecer em buscadores
 * (painel e confirmação de pedido). Restaura os valores ao sair da página.
 */
export const usePageMeta = (title: string, options: { noindex?: boolean } = {}): void => {
  const { noindex = false } = options;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let robots: HTMLMetaElement | null = null;
    let previousRobots: string | null = null;
    if (noindex) {
      robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      previousRobots = robots.content;
      robots.content = "noindex, nofollow";
    }

    return () => {
      document.title = previousTitle;
      if (robots && previousRobots !== null) robots.content = previousRobots;
    };
  }, [title, noindex]);
};
