# Auditoria de Performance Mobile — Camisa 10

**Data:** 11 de setembro de 2026  
**Escopo:** página inicial, categorias, produto, checkout e geração de QR Code Pix.  
**Ambiente de medição:** Lighthouse 12.8.2, emulação Mobile 360 × 640, CPU 4× mais lenta, RTT de 150 ms, throughput de 1,6 Mbps e build de produção Vite.  
**Critério de segurança:** as alterações são aditivas ou reversíveis. Os arquivos de imagem originais foram preservados.

## Conclusão executiva

A auditoria encontrou um gargalo principal no carregamento inicial: a aplicação entregava toda a interface em um único bundle JavaScript de **917,78 kB**, carregava scripts de terceiros de forma bloqueante, repetia a consulta completa à tabela `produtos` em diferentes telas e baixava imagens de até **6,53 MB**. A página inicial original marcou **46/100** no Lighthouse Mobile, com **LCP de 5,1 s**, **TBT de 840 ms** e **CLS de 0,223**.

A implementação introduziu code splitting por rota, cache de catálogo em memória e `sessionStorage`, projeção menor nas consultas Supabase, deduplicação de requisições concorrentes, lazy loading, skeletons, variantes WebP locais, proxy WebP responsivo para imagens remotas, cache HTTP para assets versionados, prefetch em idle/hover, timeout na integração de pagamento e cache de cinco minutos para o token consultado no fluxo Pix.

Após a otimização final, a página inicial marcou **68/100**, com **LCP de 3,8 s**, **TBT de 720 ms**, **CLS de 0** e payload total de **712 KiB**. O resultado é uma melhora de **22 pontos no score**, redução de **1,3 s no LCP**, eliminação do deslocamento de layout medido e redução de **55,6% no payload total da Home**.

## Métricas antes e depois

| Rota | Score Mobile antes | Score Mobile depois | FCP antes | FCP depois | LCP antes | LCP depois | TBT antes | TBT depois | Payload depois |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | 46 | **68** | 2,7 s | **2,5 s** | 5,1 s | **3,8 s** | 840 ms | **720 ms** | **712 KiB** |
| Categoria | Não medido no estado original | **70** | — | 2,5 s | — | 2,9 s | — | 630 ms | **842 KiB** |
| Produto | Não medido no estado original | **66** | — | 2,5 s | — | 3,1 s | — | 730 ms | **575 KiB** |
| Checkout | Não medido no estado original | **66** | — | 2,4 s | — | 2,9 s | — | 850 ms | **517 KiB** |

As medições de Lighthouse possuem variabilidade por rede, cache e resposta de terceiros. Por isso, as comparações numéricas mais confiáveis são a Home original contra a Home final e a redução observada no payload inicial. As demais rotas foram validadas no estado final para confirmar que o code splitting não introduziu regressões de carregamento.

## Bundle JavaScript

| Medição | Tamanho bruto |
|---|---:|
| Bundle único original | **917,78 kB** |
| Soma dos chunks finais | **903,93 kB** |
| Entry chunk inicial final | **404,92 kB** |
| Maior chunk funcional final | **404,92 kB** |

A soma de todos os chunks não representa o download de uma rota individual. O ganho mais importante está no carregamento sob demanda: `Admin`, `Checkout`, `Product`, `Category` e demais rotas deixaram de ser obrigatoriamente carregados juntos. O payload observado pela Home caiu de **1.604 KiB para 712 KiB** no cenário Mobile simulado.

## Componentes e módulos mais pesados

| Componente ou módulo | Observação | Tratamento aplicado |
|---|---|---|
| `pages/Admin.tsx` — 253,8 kB | Painel administrativo não deve participar do carregamento da vitrine | Rota carregada por `lazy()` |
| `pages/Checkout.tsx` — 37,8 kB | Fluxo crítico, mas não necessário na Home | Chunk próprio e carregamento sob demanda |
| `pages/Product.tsx` — 25,4 kB | Galeria, personalização e rastreamento | Chunk próprio e prefetch em hover/idle |
| `components/SideCart.tsx` — 23,9 kB | Carrinho lateral global | Mantido funcional; imagens passaram a ser lazy |
| `contexts/StoreConfigContext.tsx` — 16,6 kB | Configuração global consultada por múltiplos componentes | Cache local já existente foi preservado; catálogo foi centralizado separadamente |
| Bundle inicial compartilhado | Incluía dependências e rotas no mesmo arquivo | Manual chunks para React, Query, UI e formulários |

## Endpoints e dependências lentas

| Recurso | Medição observada | Problema | Correção |
|---|---:|---|---|
| Supabase `produtos` com projeção mínima | 194 ms médios, 132,5 KiB | Consulta era repetida e usava `select('*')` | `getCatalogProducts()` com projeção mínima, cache de 60 s e deduplicação de promessa |
| Supabase configuração | 116 ms médios, 17,4 KiB | Consulta extra no fluxo de configuração | Cache já existente mantido; token do pagamento passou a usar cache de 5 min no backend |
| `cdn.xtracky.com/scripts/utm-handler.js` | 2.006 ms médios, 29,3 KiB | Recurso bloqueava a renderização | Atributo `defer` |
| `connect.facebook.net/en_US/fbevents.js` | 2.932 ms médios, 410 KiB | Terceiro pesado e variável | Inicialização permanece funcional; o download é assíncrono e não bloqueia o parser |
| Proxy WebP `wsrv.nl` | 1.692 ms médios, 10,4 KiB para imagem de 4,73 MB | Imagens externas e uploads grandes | URLs remotas passaram a solicitar WebP redimensionado; o ganho de bytes compensa o custo de origem em conexões móveis |
| IronPay | Não executado durante a auditoria para não criar transações | A chamada podia aguardar indefinidamente | Timeout de 12 s com `AbortController`; erros continuam sendo tratados pelo checkout |

Não foram observados erros de DNS nos recursos que responderam durante a medição. O maior atraso externo foi de terceiros, especialmente Meta Pixel e Xtracky. Esses recursos não bloqueiam mais o conteúdo principal após a alteração.

## Alterações implementadas

### Imagens e Core Web Vitals

O componente `ProductImage` agora atribui `loading="lazy"` a imagens fora da dobra, `decoding="async"`, dimensões explícitas e `fetchpriority="high"` somente para imagens marcadas como prioritárias. Imagens remotas recebem uma URL WebP responsiva limitada a 720 px; URLs Supabase continuam usando transformação de imagem quando disponível. Variantes WebP foram geradas para as imagens locais e os arquivos originais foram mantidos.

O hero da Home passou a usar WebP. O Lighthouse mediu o hero como elemento de maior conteúdo da Home. O uso de imagem menor e a redução de componentes carregados antes da rota contribuíram para a redução do LCP.

Imagens de carrinho, stories, checkout, administração, tabelas e banners receberam lazy loading quando não são conteúdo acima da dobra. O QR Code Pix permanece eager depois de ser gerado, pois é o conteúdo principal da etapa de pagamento.

### Dados e Supabase

Foi criado `src/lib/catalog.ts` para centralizar a leitura de produtos. A função usa cache em memória por 60 segundos, cache de sessão, deduplicação de chamadas simultâneas e uma projeção explícita de campos. Home, Categoria, Checkout e FloatingStories reutilizam essa camada.

O Checkout deixou de consultar novamente o mesmo produto com `select('*')` quando o catálogo já está disponível. O FloatingStories deixou de refazer a consulta sempre que um story era aberto.

### Bundle e renderização

As páginas foram convertidas para `React.lazy()` com skeleton compartilhado. O build Vite passou a gerar chunks dedicados para rotas e dependências principais. A Home faz prefetch de Categoria e Produto durante idle time, enquanto links de produto e categoria fazem prefetch no primeiro hover.

O CSS deixou de importar Google Fonts por `@import`, que era um recurso render-blocking. A tipografia usa uma stack local compatível, evitando uma requisição bloqueante no primeiro paint.

### Checkout e Pix

O fluxo de criação de pagamento foi preservado. A API agora usa timeout de 12 segundos para Supabase e IronPay e mantém em memória o token resolvido por cinco minutos. Nenhuma transação foi criada durante a auditoria.

### Cache e compressão de entrega

O `netlify.toml` passou a declarar cache imutável para assets versionados e cache de sete dias para imagens locais. HTML permanece com revalidação imediata. A compressão Brotli é responsabilidade da camada de entrega do Netlify para respostas compatíveis; a configuração preparada evita cache incorreto de assets versionados. A confirmação final em produção deve verificar `Content-Encoding: br` no domínio publicado.

## Validações realizadas

O build de produção Vite foi concluído com sucesso após as mudanças. Os dois arquivos de backend de criação de pagamento passaram em `node --check`. O Lighthouse Mobile foi executado nas quatro rotas críticas finais. A checagem de lint continua reportando **113 erros preexistentes**, principalmente regras de `no-explicit-any` e `prefer-const` em arquivos não relacionados às alterações; o lint não foi usado como critério de aprovação do build porque o projeto já não estava lint-clean antes da auditoria.

O build ainda emite um aviso conhecido: `metaPixel.ts` é importado dinamicamente por `SideCart` e estaticamente por outros componentes. A funcionalidade foi preservada, mas esse módulo não pode ser isolado completamente enquanto continuar sendo usado estaticamente no fluxo de rastreamento.

## Arquivos principais alterados

| Arquivo | Objetivo |
|---|---|
| `src/App.tsx` | Code splitting, skeleton, prefetch e cache de React Query |
| `src/lib/catalog.ts` | Cache e deduplicação do catálogo Supabase |
| `src/components/ProductImage.tsx` | WebP, lazy loading, dimensões e prioridade |
| `src/pages/Index.tsx` | Catálogo em cache e hero WebP |
| `src/pages/Category.tsx` | Catálogo em cache |
| `src/pages/Checkout.tsx` | Reuso do produto em cache e lazy loading de miniaturas |
| `src/components/FloatingStories.tsx` | Remoção de consulta repetida e lazy loading |
| `vite.config.ts` | Manual chunks e build de produção |
| `netlify.toml` | Cache HTTP de assets e imagens |
| `api/create-payment.js` e `netlify/functions/create-payment.js` | Timeout e cache do token |
| `index.html` e `src/index.css` | Scripts/fontes não bloqueantes |

## Próximos passos recomendados

A publicação deve ser feita após revisar o preview em um dispositivo Android intermediário real. Em produção, deve-se verificar se o Netlify entrega `Content-Encoding: br`, confirmar o cache hit dos assets e observar as métricas reais de CrUX após tráfego suficiente.

As imagens ainda armazenadas no Supabase com 4–7 MB devem ser reprocessadas no bucket de origem quando houver uma janela operacional. A aplicação já reduz essas imagens no cliente por WebP/proxy, mas a substituição definitiva na origem reduziria também o tempo de resposta do proxy e o custo de transferência.

## Referências

[1]: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/ "Lighthouse Largest Contentful Paint"

[2]: https://web.dev/articles/lcp "Largest Contentful Paint — web.dev"

[3]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img "HTML img element — MDN Web Docs"

[4]: https://vite.dev/guide/build "Vite Production Build Performance"

[5]: https://docs.netlify.com/site-deploys/post-processing/asset-optimization/ "Netlify Asset Optimization"
