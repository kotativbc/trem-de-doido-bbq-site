#!/usr/bin/env node
/**
 * Gera o código secreto do link de edição do cardápio.
 *
 *   npm run gerar-link                (usa https://tremdedoidobbq.com.br)
 *   npm run gerar-link -- https://outro-dominio.com.br
 *
 * - cria public/api/config.php com o HASH do código (o código em si não é salvo em lugar nenhum);
 * - mostra o link completo UMA vez: guarde-o. Rodar de novo gera outro link e invalida o anterior.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SITE = "https://tremdedoidobbq.com.br";
const site = (process.argv[2] ?? DEFAULT_SITE).replace(/\/+$/, "");

if (site && !/^https?:\/\/[^\s/]+$/i.test(site)) {
  console.error('Informe só o endereço do site, por exemplo: npm run gerar-link -- https://tremdedoidobbq.com.br');
  process.exit(1);
}

// 24 bytes aleatórios = 192 bits: impossível de adivinhar.
const token = randomBytes(24).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");

const target = resolve(root, "public/api/config.php");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `<?php\n// Gerado por "npm run gerar-link". Guarda só o hash do código secreto do link de edição.\n// Não compartilhe nem publique em repositório.\ndefine('TDD_EDITOR_TOKEN_SHA256', '${hash}');\n`,
);

const link = `${site}/gerenciar/${token}`;
console.log(`
Link de edição do cardápio (guarde em local seguro; quem tiver o link consegue editar o cardápio):

  ${link}

Foi criado public/api/config.php com o hash do código.
Agora rode "npm run build" e envie o conteúdo da pasta dist/ para o public_html.
Para trocar o link (por exemplo, se ele vazou), rode este comando de novo e envie o build novamente.
`);
