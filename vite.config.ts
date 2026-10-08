import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const siteUrl = (
    loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL ?? ""
  ).replace(/\/$/, "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      {
        // Preenche __SITE_URL__ (canonical e og:*) com VITE_SITE_URL; vazio = URLs relativas à raiz.
        name: "site-url-html",
        transformIndexHtml: (html: string) =>
          html.replaceAll("__SITE_URL__", siteUrl),
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    build: {
      rollupOptions: {
        output: {
          // Bibliotecas estáveis em arquivos próprios: o navegador as mantém em cache entre versões do site.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion"],
            query: ["@tanstack/react-query"],
          },
        },
      },
    },
  };
});
