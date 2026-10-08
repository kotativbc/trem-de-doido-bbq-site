import type { Product } from "./types";

export type AddonValidation = { ok: true } | { ok: false; errors: Record<string, string> };

/**
 * Confere as opções escolhidas para um produto: só opções do próprio produto,
 * respeitando o máximo de cada grupo e os grupos obrigatórios.
 */
export const validateAddonSelection = (product: Product, selectedIds: string[]): AddonValidation => {
  const errors: Record<string, string> = {};
  const known = new Set(product.addonGroups.flatMap((g) => g.options.map((o) => o.id)));

  if (selectedIds.some((id) => !known.has(id))) {
    return { ok: false, errors: { _: "Uma das opções escolhidas não existe mais. Reabra o item." } };
  }

  for (const group of product.addonGroups) {
    const count = group.options.filter((o) => selectedIds.includes(o.id)).length;
    if (group.required && count === 0) errors[group.id] = `Escolha ao menos uma opção em "${group.name}".`;
    else if (count > group.maxSelect) {
      errors[group.id] = `Escolha no máximo ${group.maxSelect} em "${group.name}".`;
    }
  }
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
};

/** Produto que precisa de uma tela de escolha antes de ir para a sacola. */
export const hasAddonChoices = (product: Product): boolean =>
  product.addonGroups.some((g) => g.options.length > 0);
