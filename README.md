# Trem de Doido BBQ — site de pedidos

Site de pedidos do **Trem de Doido BBQ** (Av. João Pinheiro, 107 — Sarzedo/MG): cardápio, sacola, checkout com envio do pedido por WhatsApp e um painel administrativo.

Funciona **sem nenhuma credencial**, em modo demo (dados no `localStorage` do navegador), e já está organizado para trocar o armazenamento por um backend real (ver [Backend](#backend)).

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
| `npx tsc -p tsconfig.app.json --noEmit` | checagem de tipos (TypeScript `strict`) |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Tudo que começa com `VITE_` é público (vai para o JavaScript do site): **nunca coloque segredos aqui**.

| Variável | Uso | Padrão |
|---|---|---|
| `VITE_BACKEND` | backend dos repositórios; só `demo` está implementado | `demo` |
| `VITE_SITE_URL` | URL pública (sem barra final) para `canonical` e `og:image` no build | vazio (caminhos relativos) |

## Painel administrativo

Acesse `/admin`. No primeiro acesso é criada a senha do painel (mínimo 8 caracteres). Ele permite: resumo do dia, **pedidos** (status com histórico, impressão), **produtos** (CRUD, imagem, disponibilidade, destaque, adicionais), **categorias**, **cupons** e **configurações** (contato, horários, taxa por bairro, pedido mínimo, banner de promoção).

> **Importante — modo demo.** A senha é guardada (com hash PBKDF2) no navegador de quem a criou, e os pedidos ficam no navegador do cliente que os fez. Isso serve para testar e demonstrar; **não é segurança real** nem uma caixa de entrada de pedidos. Enquanto não houver backend, o canal real do pedido é o WhatsApp: o restaurante só recebe o pedido quando o cliente envia a mensagem.

## Arquitetura

```
src/
  config/      dados do negócio (business.ts) e textos do site
  domain/      regras puras e testadas: preço, carrinho, horário, taxa, cupom, pedido, WhatsApp, SEO…
  services/    contratos de repositório (repositories.ts) + implementação local (services/local)
  hooks/       TanStack Query + contexto do carrinho sobre os repositórios
  components/  seções do site, sacola/checkout, cardápio
  admin/       painel (carregado sob demanda, rota /admin/*)
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
