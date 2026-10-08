# Trem de Doido BBQ — site de pedidos

Site de pedidos do **Trem de Doido BBQ** (Av. João Pinheiro, 107 — Sarzedo/MG): cardápio, sacola, checkout com envio do pedido por WhatsApp e um painel administrativo.

Funciona **sem nenhuma credencial**: em desenvolvimento, em modo demo (dados no `localStorage` do navegador); publicado, com o cardápio guardado no servidor por uma API PHP e editável por um link secreto. Também está organizado para trocar o armazenamento por outro backend (ver [Backend](#backend)).

## Rodando localmente

Requisitos: Node 18+ e npm.

```bash
npm install
npm run dev          # http://localhost:8080
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build local |
| `npm run lint` | ESLint (0 erros; avisos restantes são de `components/ui/*` do shadcn) |
| `npm test` | testes unitários e de integração (Vitest + Testing Library) |
| `npm run test:api` | teste de ponta a ponta da API PHP (precisa de `php` e `curl`) |
| `npm run gerar-link -- <endereço do site>` | gera o link secreto de edição e cria `public/api/config.php` |
| `npx tsc -p tsconfig.app.json --noEmit` | checagem de tipos (TypeScript `strict`) |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Tudo que começa com `VITE_` é público (vai para o JavaScript do site): **nunca coloque segredos aqui**.

| Variável | Uso | Padrão |
|---|---|---|
| `VITE_BACKEND` | `php` = cardápio no servidor e editor por link secreto (já definido em `.env.production`); `demo` = tudo no navegador | `demo` (dev e testes) |
| `VITE_ENABLE_DEMO_ADMIN` | `true` liga o painel `/admin` de demonstração mesmo com `VITE_BACKEND=php` | desligado |
| `VITE_SITE_URL` | URL pública (sem barra final) para `canonical` e `og:image` no build | `https://tremdedoidobbq.com.br` (em `.env.production`) |

## Publicar na hospedagem (DirectAdmin ou qualquer Apache/LiteSpeed com PHP)

O site é estático (HTML, CSS e JavaScript gerados pelo build) mais uma API PHP pequena que guarda o cardápio. Não precisa de Node, banco de dados nem terminal no servidor.

**No seu computador (uma vez):**

```bash
npm install
npm run gerar-link   # cria o link secreto de edição para https://tremdedoidobbq.com.br (veja abaixo)
```

**A cada atualização do site:**

```bash
npm run build        # gera a pasta dist/
```

Envie **todo o conteúdo de `dist/`** para a pasta `public_html` (pelo Gerenciador de Arquivos ou FTP), sobrescrevendo os arquivos existentes. Atenção:

- **Mostre os arquivos ocultos** no Gerenciador de Arquivos/FTP: o `.htaccess` é obrigatório. Sem ele, endereços como `/pedido/...` e o link do editor dão erro 404 ao recarregar a página.
- **Não apague** as pastas `api/data` (cardápio salvo e histórico) e `uploads` (fotos enviadas pelo editor) ao atualizar. Sobrescrever sem apagar é seguro: o `dist/` não contém essas pastas.
- O site precisa estar na **raiz** do domínio (ou subdomínio). Para uma subpasta, defina `base` em `vite.config.ts`.
- O PHP precisa ser 7.4 ou superior, com permissão de escrita na pasta `api/` e na raiz (para criar `api/data` e `uploads`). Na maioria das hospedagens DirectAdmin isso já é o padrão (pastas 755).
- O endereço público (`https://tremdedoidobbq.com.br`) já está em `.env.production` (`VITE_SITE_URL`) e vai para o `canonical` e a imagem de compartilhamento. Se usar `www` ou outro domínio, ajuste lá e também em `public/sitemap.xml` e `public/robots.txt`, que têm o endereço escrito.

## Link secreto para editar o cardápio

O cliente edita o cardápio (adicionar, remover, alterar preço, foto, descrição, esgotar, ordem, categorias) por um endereço como:

```
https://tremdedoidobbq.com.br/gerenciar/3f9a...c41d     (48 caracteres aleatórios)
```

- **Sem senha**: quem tem o link entra. O link não aparece em nenhuma página do site, fica fora do `robots.txt` e a página tem `noindex`.
- **Impossível de adivinhar**: o código tem 192 bits aleatórios. Ele é conferido **no servidor** (a API só guarda o hash SHA-256 dele, em `api/config.php`). Quem digita um código errado, ou `/gerenciar` sem código, vê a mesma página 404 de qualquer endereço inexistente.
- **Para gerar (ou trocar) o link**: `npm run gerar-link`, depois `npm run build` e envie `dist/` de novo. O link é mostrado uma única vez; guarde-o num lugar seguro. Gerar de novo invalida o link anterior (use isso se ele vazar).
- **Cada alteração é salva na hora** no servidor e aparece para todos os clientes ao recarregar o site. Não precisa fazer build nem enviar arquivos para mudar o cardápio.
- **Segurança de verdade**: o link funciona como uma chave. Quem o receber (ou quem o encontrar no histórico do navegador, num print ou numa mensagem encaminhada) consegue editar o cardápio. Compartilhe só com quem deve editar e troque o link se desconfiar de vazamento.
- **Cópias de segurança**: o servidor guarda as últimas 30 versões em `api/data/history/` (arquivos `catalog-NNNNNN.json`; para voltar a uma, restaure-a pelo botão "Restaurar cópia" do editor). O editor também tem "Baixar cópia". Faça uma cópia antes de mudanças grandes.
- **Primeira vez**: enquanto ninguém salvar nada, o site mostra o cardápio que vem no código (`src/data/seed/catalog.ts`). A partir da primeira edição, o cardápio do servidor é o que vale; mudanças futuras nesse arquivo não aparecem sozinhas (use "Restaurar cópia").

Fotos: o editor reduz a imagem no navegador (até 900 px) e a envia para `uploads/` com nome aleatório; o servidor confere que o arquivo é mesmo JPG, PNG ou WebP e bloqueia a execução de scripts nessa pasta.

Testes da API PHP (precisa de `php` e `curl` no seu computador): `npm run test:api`.

## Painel de demonstração (`/admin`)

Existe um painel com senha (pedidos, produtos, cupons, configurações) cujos dados ficam **só no navegador** de quem o usa. Serve para desenvolvimento e demonstração (`npm run dev`) e **não existe na versão publicada** (o build de produção usa `VITE_BACKEND=php`, que o desliga). Na versão publicada, pedidos continuam chegando pelo WhatsApp; cupons, taxa de entrega por bairro, horários e banner são os valores de `src/config/business.ts`.

## Arquitetura

```
src/
  config/      dados do negócio (business.ts) e textos do site
  domain/      regras puras e testadas: preço, carrinho, horário, taxa, cupom, pedido, WhatsApp, SEO…
  services/    contratos de repositório (repositories.ts) + implementação local (services/local) e PHP (services/php)
public/api/    API PHP do cardápio (catalog.php, upload.php) copiada para dist/ no build
  hooks/       TanStack Query + contexto do carrinho sobre os repositórios
  components/  seções do site, sacola/checkout, cardápio
  editor/      editor do cardápio por link secreto (rota /gerenciar/:código)
  admin/       painel de demonstração (rota /admin/*) e páginas reaproveitadas pelo editor
  pages/       Index, confirmação do pedido (/pedido/:id), 404
```

Princípios: valores em **centavos inteiros**; um único cálculo de preço (`priceCart`) usado pela sacola, pelo checkout e pela mensagem; a sacola guarda só **referências** (preço e disponibilidade são recalculados); nenhum dado de contato/horário fixo em componentes.

## Backend

Os componentes só falam com `src/services/index.ts`. Para usar um backend real (Supabase, Firebase, API própria):

1. Implemente os contratos de `src/services/repositories.ts` (catálogo, configurações, pedidos, cupons, autenticação).
2. Devolva-os em `createRepositories()` conforme `VITE_BACKEND`.
3. Valide **no servidor**: preço dos itens, cupons e limites de uso, horário e autenticação. No cliente isso é apenas conveniência.

## Pendências de configuração do restaurante

Valores iniciais editáveis em **Admin → Configurações** (ver dúvidas Q1–Q10 em `IMPLEMENTATION_PLAN.md`): taxa de entrega por bairro (hoje R$ 0,00), pedido mínimo (hoje sem mínimo), previsão de preparo/entrega (estimativa), URL pública do site, e a confirmação de que as avaliações exibidas são reais.

## Acessibilidade, SEO e desempenho

- Auditoria axe (WCAG 2.0/2.1 A/AA + boas práticas) sem violações nas telas públicas, no checkout e em todo o painel; link "Pular para o conteúdo", foco visível, `prefers-reduced-motion` respeitado.
- Dados estruturados `Restaurant` gerados a partir das configurações; Open Graph/Twitter, manifest, ícones; `/admin` e `/pedido/*` com `noindex`.
- Painel, confirmação do pedido e formulário do checkout são carregados sob demanda; bibliotecas estáveis em chunks próprios.

Veja o histórico em [CHANGELOG.md](CHANGELOG.md).
