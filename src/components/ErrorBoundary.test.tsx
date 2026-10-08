import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

const Bomb = ({ explode }: { explode: boolean }) => {
  if (explode) throw new Error("boom");
  return <p>tudo certo</p>;
};

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sem erro, renderiza os filhos", () => {
    render(<ErrorBoundary><Bomb explode={false} /></ErrorBoundary>);
    expect(screen.getByText("tudo certo")).toBeInTheDocument();
  });

  it("com erro, mostra a tela amigável (não a página branca) e registra o erro", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ErrorBoundary><Bomb explode /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado por aqui");
    expect(screen.getByRole("button", { name: "Recarregar a página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
    expect(log).toHaveBeenCalled();
  });

  it("volta a renderizar quando a rota (resetKey) muda", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Bomb explode /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="/b"><Bomb explode={false} /></ErrorBoundary>);
    expect(screen.getByText("tudo certo")).toBeInTheDocument();
  });
});
