import { useEffect } from "react";

/**
 * Pede confirmação do navegador ao fechar/recarregar a aba enquanto `active` for verdadeiro.
 * Usado no checkout: o cliente já digitou dados que seriam perdidos.
 */
export const useBeforeUnloadWarning = (active: boolean): void => {
  useEffect(() => {
    if (!active) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Navegadores antigos exigem returnValue; os atuais ignoram o texto e mostram o aviso padrão.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
};
