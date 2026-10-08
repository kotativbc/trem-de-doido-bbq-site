/** "Hambúrguer Gourmet!" → "hamburguer-gourmet" */
export const slugify = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Emojis e símbolos viram separador; letras e números ficam.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Id derivado do nome, sem colidir com os existentes ("burger", "burger-2", …). */
export const uniqueId = (base: string, existing: Iterable<string>): string => {
  const taken = new Set(existing);
  const root = slugify(base) || "item";
  if (!taken.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
};
