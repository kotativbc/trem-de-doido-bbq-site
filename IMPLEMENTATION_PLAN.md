# IMPLEMENTATION_PLAN — Trem de Doido BBQ

Plano de auditoria, refatoração e evolução do repositório `kotativbc/trem-de-doido-bbq-site`.
Baseline auditado no commit `55bf1e6` (branch padrão), em 08/10/2026.

> Regra de ouro: primeiro paridade visual e funcional com o site atual, depois novas funções.
> Cardápio, preços, textos e imagens atuais são a fonte da verdade e não mudam sem marcação explícita.

---

## 1. Diagnóstico

### 1.1 Estado do baseline (medido, antes de qualquer alteração de código)

| Item | Resultado |
|---|---|
| `npm ci` | **Falha**: `package-lock.json` fora de sincronia com `package.json` (faltam `vitest`, `jsdom`, `@testing-library/*`, `framer-motion` 12.43). Existem 3 lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`). |
| `npm install` | OK (496 pacotes) |
| `vite build` | OK em ~7 s. JS 495 kB (159 kB gzip), CSS 66 kB, imagens de 20 a 190 kB cada. |
| `tsc` | 0 erros, mas com `strict: false` e `noImplicitAny: false`. Com `--strict --noImplicitAny` continua com 0 erros; só acusa `Switch` importado e não usado em `CartDrawer.tsx`. Migrar para strict é barato. |
| ESLint | **3 erros, 8 avisos** (erros: interface vazia em `command.tsx` e `textarea.tsx`, `require()` em `tailwind.config.ts`). |
| Testes | 1 teste trivial (`expect(true).toBe(true)`). Cobertura real: zero. |
| Rotas | `/` (Index) e `*` (NotFound). Não há rota de administração, confirmação ou pedidos. |

Observação de ambiente: as capturas de tela feitas no sandbox usam fonte serif de fallback porque o Google Fonts é bloqueado lá. Em produção a fonte é Bebas Neue / DM Sans. O mapa embutido também não carrega no sandbox. Isso é limitação do ambiente de auditoria, não defeito do site.

### 1.2 Defeitos e inconsistências encontrados

Severidade: **A** = quebra uso real, **M** = degrada qualidade/acessibilidade, **B** = higiene.

| # | Sev. | Achado | Evidência |
|---|---|---|---|
| D1 | A | **Drawer da sacola fica sob o header fixo.** Drawer é `z-[45]`, header é `z-50`. O título "SACOLA"/"FINALIZAR PEDIDO" e o botão X ficam escondidos e **não clicáveis** (o ícone do carrinho do header intercepta o clique). No mobile o drawer ocupa a tela toda, então o overlay também não é clicável: o único jeito de fechar é o link "+ Adicionar mais itens". | Teste Playwright: clique em "Fechar sacola" bloqueado pelo `<svg>` do header. Screenshot `mobile-drawer-open`. |
| D2 | M | Drawer sem `aria-modal`, sem trap de foco, **`Escape` não fecha**, **a página rola por trás** (body sem scroll lock). | `dialog_aria_modal: null`, `escape_closes_drawer: false`, `page_scrolls_behind_drawer: true`. |
| D3 | M | **Overflow horizontal de 24 px** em 375 px e 768 px. Origem: `PitmasterSection` anima `x: 40` e o deslocamento inicial estoura a viewport. | `scrollWidth - clientWidth = 24`. |
| D4 | A | Link "Horários" do header aponta para `#horarios`, **id que não existe**. O botão não faz nada. | `ids = [root, cardapio, localizacao]`. |
| D5 | A | Ícone do Instagram no rodapé tem `href="#"`. Botão que parece funcional e não faz nada. | `footer_instagram_href: "#"`. |
| D6 | M | **`CheckoutSection.tsx` é código morto**: não é renderizado em `Index`. Duplica a lógica do checkout que vive dentro do `CartDrawer`, com regras diferentes. | `Index.tsx` não importa o componente. |
| D7 | A | **Regra de troco inconsistente.** `CartDrawer` (ativo): troco obrigatório sempre que pagamento é dinheiro, campo livre. `CheckoutSection` (morto): troco opcional via checkbox. Nenhum valida valor: `"abc"` é aceito; troco menor que o total também. | `accepts_garbage_change: true`. |
| D8 | M | Geolocalização (apenas no componente morto) preenche o endereço com `Lat: …, Lng: …`, sem orientação ao cliente, e usa `alert()`. | `CheckoutSection.tsx:45-51`. |
| D9 | M | **Dados de negócio duplicados e hardcoded**: número do WhatsApp em 4 arquivos (`CartDrawer`, `CheckoutSection`, `FooterSection`, `MobileBottomNav`); endereço, horário, telefone e Instagram em `LocationSection`; nome em 4 lugares; ano "2026" fixo no rodapé. | `grep` de `5531997036657`, `18:00`, etc. |
| D10 | M | **Carrinho não persiste**: recarregar a página zera a sacola. `isCheckoutOpen`/`setIsCheckoutOpen` existem no contexto mas só o componente morto usa. | Teste: `cart_persisted_after_reload: false`. |
| D11 | M | Após enviar, o drawer fecha e o carrinho é limpo **sem nenhuma confirmação**; o carrinho é limpo antes de saber se o WhatsApp abriu (pop-up bloqueado = pedido perdido). | `confirmation_shown: false`. |
| D12 | B | Formatação de preço `toFixed(2).replace(".", ",")` repetida em 7 lugares. Sem `Intl.NumberFormat`. | `grep toFixed`. |
| D13 | M | Descrição do card é `<p onClick>`: não é alcançável por teclado nem anunciada como botão. | `MenuSection.tsx:52-57`. |
| D14 | M | SEO/PWA incompleto: sem `<link rel="icon">`, sem `og:image`, `og:url`, `twitter:*`, `canonical`, manifest, JSON-LD de restaurante; `robots.txt` sem sitemap; `public/placeholder.svg` e `favicon.ico` genéricos do template. | `index.html`. |
| D15 | B | `NotFound` em inglês ("Oops! Page not found"), fora do tema e com `console.error`. Não existe `ErrorBoundary` (erro de render = tela branca). | `NotFound.tsx`. |
| D16 | B | `package.json` ainda chama `vite_react_shadcn_ts`; README é "TODO: Document your project here"; `lovable-tagger` como devDependency. | arquivos. |
| D17 | B | Muitas cores hex fixas (`#0A0A0A`, `#1C1C1C`, `#111111`, `#F97316`…) em vez de tokens. Visual correto, mas fora do design system. Mantidas na paridade. | grep. |
| D18 | B | 36 dos 49 componentes `ui/*` do shadcn não são usados. Inofensivos (tree-shaking), e boa parte será usada pelo admin (`table`, `tabs`, `dialog`, `select`, `sheet`, `switch`…). Não remover agora. | análise de imports. |
| D19 | M | Item "Frango Defumado" aparece duas vezes com ids diferentes (`d2` em Domingos e `b6` em American BBQ), ambos R$ 60,00. Pode ser intencional (versão de domingo). Preservado. | `menuData.ts`. |
| D20 | B | Aba padrão do cardápio é "Hambúrgueres" embora a primeira aba seja "Domingos". Comportamento do original, preservado. | `MenuSection.tsx:109`. |
| D21 | M | Domingos é rotulado "Disponível somente aos domingos" mas pode ser pedido em qualquer dia. Não existe regra de disponibilidade. | fluxo. |
| D22 | M | Mapa do Google (`iframe`) sem fallback quando falha e sem botão "Abrir rota". | `LocationSection.tsx`. |
| D23 | B | Avaliações da prova social (3 textos, "5.0 no Google") são texto fixo no componente. Preciso que o dono confirme que são avaliações reais (ver dúvida Q8). | `SocialProof.tsx`. |

### 1.3 O que está certo e deve ser preservado

Identidade visual (tokens HSL em `index.css`, Bebas Neue + DM Sans), ordem das seções, parallax e animações do Hero, hover/tap nos cards, badges dourado "Especial" e verde "Novo", descrição truncada no mobile, contador no header, `MobileBottomNav` + `MobileCartBar`, `safe-area-inset-bottom`, formato exato da mensagem de WhatsApp (ver 4.4), 33 imagens de produto + hero + pitmaster em `src/assets`.

---

## 2. Mapa de componentes

```
main.tsx
└─ App.tsx  (QueryClientProvider > TooltipProvider > Toaster/Sonner > BrowserRouter)
   ├─ "/"  pages/Index.tsx  (CartProvider)
   │   ├─ StickyHeader        nav (Cardápio, Localização, Horários*), CTA, contador
   │   ├─ HeroSection         parallax (framer-motion), SmokeButton
   │   ├─ SocialProof         5 estrelas + 3 reviews (hardcoded)
   │   ├─ MenuSection         abas por categoria + MenuCard (memo)
   │   ├─ PitmasterSection    foto + texto + 3 destaques
   │   ├─ LocationSection     iframe do mapa + 4 blocos de info (hardcoded)
   │   ├─ FooterSection       WhatsApp, Instagram*, crédito KotaTI
   │   ├─ CartDrawer          sacola + checkout inline + montagem da mensagem WhatsApp
   │   ├─ MobileCartBar       resumo fixo da sacola (md:hidden)
   │   └─ MobileBottomNav     4 atalhos (md:hidden)
   └─ "*"  pages/NotFound.tsx

Não conectado: components/CheckoutSection.tsx (morto), components/NavLink.tsx (sem uso)
* = com defeito (D4, D5)
```

Estado: `CartContext` (itens, abrir/fechar drawer) é o único estado global. Todo o resto é `useState` local.

---

## 3. Mapa de dados

| Origem | Conteúdo |
|---|---|
| `data/menuData.ts` | `MenuItem {id, name, description, price:number, category, badge?}`; 7 categorias (id, label com emoji, icon); **33 produtos** (d1-d4, h1-h8, c1-c3, e1-e4, b1-b7, a1-a2, be1-be5). |
| `data/menuImages.ts` | `Record<id, url>` com 33 imagens. Bebidas e produtos sem descrição usam `description: ""`. |
| `context/CartContext.tsx` | `CartItem {id, name, price, qty, category}`, ações `addItem/removeItem/clearCart`, totais, flags do drawer. |
| Hardcoded nos componentes | WhatsApp, endereço, horário, telefone, Instagram, nome, textos do Hero/Pitmaster, reviews, crédito do dev, URL do embed do Maps. |

Preços hoje são `number` em reais com ponto flutuante (`36.9`, `39.99`). **Decisão:** no domínio novo, dinheiro vira **inteiro em centavos** (`3690`, `3999`) com conversão única no ponto de entrada dos dados. Os valores exibidos permanecem idênticos.

---

## 4. Plano de migração/evolução

### Fase 1 — Auditoria e baseline (esta fase)
- Executar e medir o projeto; este documento.
- Correções básicas sem recurso novo: lockfile; 3 erros de lint e import morto; âncora `#horarios` (D4); link do Instagram (D5); overflow do Pitmaster (D3); camadas/Escape/scroll-lock/`aria-modal` do drawer (D1, D2); `NotFound` em pt-BR (D15).
- Registrar capturas de baseline (mobile 375, tablet 768, desktop 1280, wide 1920) para comparação visual.

### Fase 2 — Refatoração segura (sem mudar aparência)
- `src/config/business.ts` único com nome, endereço, telefone, WhatsApp, Instagram, horários, textos institucionais, crédito do dev (D9).
- `src/domain/`: tipos (`Money`, `Product`, `Category`, `CartLine`, `Order`…), **`pricing.ts` única** (subtotal, taxa, desconto, total), `format.ts` (`Intl.NumberFormat` pt-BR, D12), `availability.ts`, `whatsapp.ts` (mensagem idêntica à atual), `checkout.schema.ts` (Zod, incluindo troco, D7).
- Remover `CheckoutSection.tsx` (D6): duplicado e desconectado; o fluxo único passa a viver no checkout do drawer, agora em componentes pequenos (`CartDrawer`, `CartLineRow`, `CheckoutForm`, `OrderSummary`).
- Reducer do carrinho puro + persistência em `localStorage` versionada e validada com Zod (D10).
- Camada `services/` com **interfaces de repositório** (`CatalogRepository`, `OrderRepository`, `SettingsRepository`, `AuthService`) e implementação `localStorage`/seed; componentes só falam com hooks do TanStack Query.
- `tsconfig` em `strict: true` (custo medido ≈ 0).
- Testes: carrinho, preço, persistência, mensagem de WhatsApp (teste dourado comparando com a saída do baseline), validação do checkout.

### Fase 3 — Novas funcionalidades
Ordem de entrega: (1) entrega + checkout (telefone, CEP/ViaCEP com fallback manual, complemento, referência, taxa por faixa, pedido mínimo, aberto/fechado, previsão); (2) cupons, adicionais, observação por item, banner, destaque; (3) busca, filtros, esgotado, confirmação de pedido, "pedir novamente"; (4) admin: login, dashboard, CRUD de produtos/categorias, ordenação, configurações; (5) gestão de pedidos com histórico de status e impressão. Rotas novas: `/admin/*` (lazy), `/pedido/:id`.

### Fase 4 — Qualidade e entrega
Acessibilidade (foco, trap, labels, contraste AA, `prefers-reduced-motion`), SEO (favicon, manifest, OG, JSON-LD `Restaurant`, canonical, sitemap), performance (lazy de rotas admin, imagens com dimensões), `ErrorBoundary`, testes de integração, varredura nos 4 viewports comparada ao baseline, README, CHANGELOG, build final.

### 4.4 Contrato de paridade da mensagem de WhatsApp (travado por teste)

```
🔥 NOVO PEDIDO — TREM DE DOIDO BBQ 🔥
━━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* <nome>
🏠 *Entrega/Retirada:* <Entrega | Retirada no Balcão>
📍 *Endereço:* <endereço | Retirada no local>
━━━━━━━━━━━━━━━━━━━━━━
🍖 *ITENS DO PEDIDO:*

<Nome> x<qtd> — R$ <valor>
━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL:* R$ <total>
💳 *PAGAMENTO:* <Pix | Cartão | Dinheiro>
💵 *Troco para:* R$ <valor>        (só em dinheiro)
━━━━━━━━━━━━━━━━━━━━━━
📝 *Observações:* <texto | Nenhuma>
```

Na Fase 3 entram, **sem quebrar esse esqueleto**, linhas adicionais (telefone, subtotal, taxa, desconto, cupom, previsão, observação por item).

---

## 5. Decisões técnicas

1. **Stack mantida** (React 18, Vite, TS, Tailwind, shadcn/Radix, Framer Motion, Lucide, Router, RHF + Zod, TanStack Query). Nenhuma dependência nova é necessária para as funções pedidas; `@supabase/supabase-js` **não** será adicionado agora (sem credenciais). O ponto de troca é a interface de repositório, documentada no README.
2. **Gerenciador oficial: npm** (`package-lock.json` regenerado). `bun.lock`/`bun.lockb` ficam até confirmação (Q10), porque três lockfiles divergentes causam builds diferentes.
3. **Dinheiro em centavos inteiros**, formatação via `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`.
4. **Preço calculado em um único módulo** (`domain/pricing.ts`), consumido por card, carrinho, checkout, mensagem de WhatsApp e admin.
5. **Persistência do carrinho**: chave versionada (`tdd.cart.v1`), dados validados com Zod ao ler; preço não é confiado do storage (é recalculado a partir do catálogo vigente, e itens que não existem mais são descartados com aviso).
6. **Autenticação do admin em modo demo**: sem senha no repositório. No primeiro acesso o dono **define a senha** (hash SHA-256 via WebCrypto em `localStorage`). É proteção de interface, **não segurança real**: qualquer pessoa com acesso ao navegador pode alterá-la. A tela diz isso. Segurança real exige o backend (Q1).
7. **Tokens visuais**: o admin usa os mesmos tokens HSL; a paridade da página pública mantém as cores hex atuais até a fase de limpeza.
8. **Geolocalização opcional**, nunca preenche só lat/lng: se obtida, tenta resolver para endereço/CEP; se falhar, explica e devolve o foco ao formulário manual.
9. **Confirmação honesta**: a tela após o envio diz "Abrimos o WhatsApp com seu pedido. Ele só é considerado recebido quando o restaurante responder." O carrinho só é limpo depois que o cliente confirma ("Enviei o pedido") ou após a abertura bem-sucedida da janela; se o pop-up for bloqueado, oferece o link direto e mantém a sacola.
10. **Testes**: Vitest + Testing Library (já instalados). Playwright fica como verificação manual/scriptada, sem entrar como dependência do projeto.

---

## 6. Riscos e dúvidas

### Riscos
- **R1. Sem backend, o admin só enxerga pedidos feitos no mesmo navegador.** Pedidos nascem no celular de cada cliente; `localStorage` é local ao aparelho. No modo demo, a "gestão de pedidos" funciona para teste e para pedidos criados na mesma máquina, **não** como caixa de entrada real do restaurante. Enquanto não houver backend, o WhatsApp continua sendo o canal real do pedido.
- **R2. Cupom com limite de uso e preço calculado no cliente** podem ser burlados sem servidor. Em produção, validar no backend.
- **R3. Regressão visual** ao trocar hex por tokens ou reorganizar componentes: mitigada com capturas de baseline e comparação nos 4 viewports.
- **R4. Fontes e mapa dependem de terceiros** (Google Fonts, Maps). Sem rede o mapa some; adiciono fallback com botão "Abrir no Google Maps".
- **R5. Taxa de entrega por bairro** depende de dados que só o restaurante tem.

### Dúvidas de negócio (valores usados enquanto não houver resposta, todos editáveis no admin)

| # | Pergunta | Opções | Padrão adotado |
|---|---|---|---|
| Q1 | Qual backend para pedidos/admin reais? | Supabase · Firebase · API própria · só demo | **Só demo** (interfaces prontas para trocar) |
| Q2 | Faixas de taxa de entrega por bairro? | informar lista · taxa única · grátis | **Sem taxa (R$ 0,00)**, marcada como "a configurar" |
| Q3 | Pedido mínimo? | valor · sem mínimo | **Sem mínimo** |
| Q4 | Itens de "Domingos" devem ser bloqueados fora de domingo? | bloquear · só avisar · não controlar | **Não bloquear** (preserva o comportamento atual); chave no admin para ativar |
| Q5 | Pedido com a loja fechada? | bloquear envio · permitir com aviso | **Avisar e bloquear envio**; chave "aceitar pedido fora do horário" no admin |
| Q6 | Previsão de preparo/entrega? | minutos de preparo e de entrega | **Placeholder 40–60 min**, marcado como estimativa configurável |
| Q7 | Link oficial do Instagram? | confirmar URL | `https://instagram.com/tremdedoidobbq` |
| Q8 | As 3 avaliações e a nota 5.0 são reais do Google? | sim · trocar | **Mantidas como estão**; se não forem reais, devem sair |
| Q9 | Manter o crédito "Desenvolvido por KotaTI" com link? | sim · não | **Mantido** (movido para config) |
| Q10 | Remover `bun.lock`/`bun.lockb`? | sim (npm oficial) · manter bun | **Mantidos** até confirmar |
