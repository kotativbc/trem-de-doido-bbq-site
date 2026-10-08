# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/).

## [1.1.0] — Cardápio atualizado, hospedagem estática e editor por link secreto

### Revisão do cardápio (conforme o cardápio impresso mais recente)
- Preços: Trem Vermelho 36,90 → **39,90**; Burger de Costela 39,99 → **46,99**; Burger de Costelinha 39,90 → **46,90**; Big Trem de Doido Especial 49,90 → **59,90**; Trem de Doido Brutus 49,90 → **59,90**; Combo Casal 64,90 → **69,90**; Beef Ribs 80,00 → **110,00**; Pork Ribs 80,00 → **99,90**.
- Textos: gramatura das ribs (700 g, com molho grill), descrição da Tábua Mista (400 g costela + 400 g costelinha + 300 g batata), do Brutus e do Big Trem de Doido (ketchup).
- Novo: **Suco Del Valle 1L, R$ 12,00** (sem foto até o cliente enviar uma pelo editor).
- Conferidos sem alteração: Trem de Doido Tradicional, Kids e Especial, Combo Família, espetinhos (R$ 13), Tábua Mista (R$ 140), Chicken Legs, Frango, batatas e as demais bebidas.
- Itens que estão no site e **não** aparecem no cardápio impresso (mantidos; o cliente decide): os 4 pratos de Domingos, Combo Infantil (R$ 36,90), Pulled Pork (R$ 70), Fraldinha Defumada (R$ 90) e o espetinho de Porco.

### Adicionado
- **Hospedagem estática**: `public/.htaccess` (rotas do site de página única, cache, compressão, `noindex` no editor) e `.env.production`; `npm run build` gera tudo em `dist/` para enviar ao `public_html`.
- **API PHP** (`public/api/`): `catalog.php` (leitura pública; gravação com código secreto, controle de versão, validação, histórico das últimas 30 versões) e `upload.php` (fotos de produtos).
- **Editor por link secreto** `/gerenciar/<código>`: produtos, categorias, fotos, esgotado, ordem, cópia de segurança (baixar/restaurar). O código é conferido no servidor; sem ele, a página é um 404 comum.
- `npm run gerar-link` e `npm run test:api`.

### Alterado
- Na versão publicada (`VITE_BACKEND=php`) o painel de demonstração `/admin` fica desligado; produtos e categorias são editados só pelo link secreto.
- Os testes de regra (preço, WhatsApp, pedido) usam os preços do cardápio original congelados, para que atualizar preços não os quebre.
- Corrigido teste instável do formato do código do pedido (o gerador pode usar a letra L).

## [1.0.0] — Evolução do site

### Corrigido (auditoria do original)
- Âncora `#horarios` do menu agora existe; links de redes sociais e WhatsApp vêm de uma única configuração.
- Drawer da sacola: camadas, `Escape`, travamento/devolução do scroll e `aria-modal`.
- Overflow horizontal do Pitmaster no mobile.
- Validação de troco inconsistente entre dois checkouts; o checkout duplicado e desconectado foi removido.
- Erros de TypeScript/ESLint, dependências mortas (`lovable-tagger`, `NavLink` não usado, `placeholder.svg`), lockfiles conflitantes (`bun.lock`/`bun.lockb` removidos; o oficial é `package-lock.json`).
- Geolocalização guardava só latitude/longitude; agora o pedido leva um link de mapa (pin) junto com o endereço digitado.

### Adicionado
- **Checkout**: telefone, CEP (ViaCEP com preenchimento manual como alternativa), bairro, complemento, referência, taxa por bairro, pedido mínimo, aberto/fechado, previsão de tempo, cupom, troco validado, retirada/entrega.
- **Confirmação honesta**: a sacola só é limpa se o WhatsApp realmente abriu; popup bloqueado mostra aviso e preserva o formulário. Página `/pedido/:id`, "pedir novamente".
- **Cardápio**: busca, filtros (preço, disponíveis, favoritos), favoritos, destaques, adicionais com regras (mín./máx.), observação por item, esgotado, banner de promoção.
- **Painel `/admin`**: login (senha com PBKDF2), resumo, pedidos com histórico de status e impressão, CRUD de produtos/categorias/cupons, configurações.
- **Qualidade**: camada de repositórios com modo demo, `ErrorBoundary`, `beforeunload` com sacola cheia, mais de 280 testes (domínio, serviços, integração do fluxo de compra e do admin).
- **SEO/PWA**: Open Graph/Twitter, canonical (`VITE_SITE_URL`), JSON-LD `Restaurant`, manifest, ícones, `robots.txt`, `noindex` no painel.
- **Acessibilidade**: link "Pular para o conteúdo", `<main>`, `prefers-reduced-motion`, rótulos e foco revisados; axe sem violações.
- README, `.env.example` e este CHANGELOG.

### Alterado
- **Desvio visual deliberado**: texto de botões/etiquetas sobre o laranja passou de branco para `#0A0A0A` (contraste 2,85:1 → ~7:1, exigência WCAG AA). O laranja da marca não mudou. Para reverter, troque `--primary-foreground` em `src/index.css` (e aceite a reprovação de contraste).
- Link do Instagram no rodapé passa a ser sempre sublinhado (distinguível sem depender de cor).
- TypeScript em modo `strict`.
- Carregamento sob demanda do painel, da confirmação e do formulário de checkout; bibliotecas estáveis (React, Framer Motion, TanStack Query) em chunks próprios e cacheáveis. O arquivo principal caiu de 694 kB para ~299 kB (≈92 kB gzip); o total da primeira visita (~640 kB, ≈200 kB gzip) ficou próximo do anterior, com melhor cache entre versões.

### Limitações conhecidas
- Modo demo: pedidos, cupons e senha do admin ficam no navegador; limites de uso de cupom e preços só são confiáveis com validação em servidor.
- Sem pagamento online (fora do escopo).
