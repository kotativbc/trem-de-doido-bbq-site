# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/).

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
- Sem `sitemap.xml` (depende do domínio final).
