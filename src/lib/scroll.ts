/** Rola até a seção; respeita "reduzir movimento" do sistema (sem rolagem animada). */
export const scrollToId = (id: string): void => {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
};
