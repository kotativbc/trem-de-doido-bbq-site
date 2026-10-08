export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 900;
const QUALITY = 0.82;

/** Mensagem de erro em português, ou null se o arquivo pode ser usado. */
export const validateImageFile = (file: Pick<File, "type" | "size" | "name">): string | null => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato não aceito. Use JPG, PNG ou WebP.";
  }
  if (file.size > MAX_SOURCE_BYTES) return "A imagem passa de 5 MB. Escolha uma menor.";
  return null;
};

/** Reduz a imagem (lado maior até 900 px) e devolve um data URL JPEG leve, adequado ao armazenamento do navegador. */
export const fileToResizedDataUrl = async (file: File): Promise<string> => {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Este navegador não conseguiu processar a imagem.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
};
