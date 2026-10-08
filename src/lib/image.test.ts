import { describe, expect, it } from "vitest";
import { MAX_SOURCE_BYTES, validateImageFile } from "./image";

describe("validação de imagem enviada", () => {
  it("aceita JPG, PNG e WebP dentro do limite", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImageFile({ type, size: 1000, name: "a" })).toBeNull();
    }
  });
  it("recusa outros formatos (incluindo SVG, que pode carregar script) e arquivos grandes", () => {
    expect(validateImageFile({ type: "image/svg+xml", size: 10, name: "a.svg" })).toMatch(/Formato não aceito/);
    expect(validateImageFile({ type: "application/pdf", size: 10, name: "a.pdf" })).toMatch(/Formato não aceito/);
    expect(validateImageFile({ type: "image/png", size: MAX_SOURCE_BYTES + 1, name: "a.png" })).toMatch(/5 MB/);
  });
});

describe("dataUrlToBlob", () => {
  it("converte data URL em arquivo com o tipo e os bytes certos", async () => {
    const { dataUrlToBlob } = await import("./image");
    const blob = dataUrlToBlob("data:image/jpeg;base64,/9j/4AAQ");
    expect(blob.type).toBe("image/jpeg");
    expect(blob.size).toBe(6);
  });
});
